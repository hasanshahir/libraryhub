import prisma from '../utils/prisma';
import { BorrowStatus, FineStatus, ReservationStatus } from '@prisma/client';

const DAILY_FINE_RATE = parseFloat(process.env.DAILY_FINE_RATE || '1.50');

export class BorrowService {
  /**
   * Transactional Borrowing:
   * Guarantees atomic copy deduction, copy availability checks, and reservation fulfillment.
   * Copies can NEVER drop below zero.
   */
  static async borrowBook(userId: string, bookId: string, days: number = 14) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch book with locking / fresh data
      const book = await tx.book.findUnique({
        where: { id: bookId },
      });

      if (!book) {
        throw new Error('Book not found in library catalogue');
      }

      // 2. Strict copy check
      if (book.availableCopies <= 0) {
        throw new Error('No copies available to borrow. Please reserve this book to join the waitlist queue.');
      }

      // 3. Check if user already has an active borrow of this same book
      const activeBorrow = await tx.borrowRecord.findFirst({
        where: {
          bookId,
          userId,
          status: { in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE] },
        },
      });

      if (activeBorrow) {
        throw new Error('You already have an active loan for this book');
      }

      // 4. Check unpaid fines limit ($25 max allowed before checkout block)
      const unpaidFines = await tx.fine.findMany({
        where: {
          userId,
          status: FineStatus.UNPAID,
        },
      });

      const totalUnpaid = unpaidFines.reduce((sum, f) => sum + Number(f.amount), 0);
      if (totalUnpaid > 25.0) {
        throw new Error(`Borrowing blocked: You have $${totalUnpaid.toFixed(2)} in outstanding library fines. Please settle your fines first.`);
      }

      // 5. Atomic decrement of available copies
      const updatedBook = await tx.book.update({
        where: { id: bookId },
        data: {
          availableCopies: {
            decrement: 1,
          },
        },
      });

      // Defensive invariant check
      if (updatedBook.availableCopies < 0) {
        throw new Error('Transaction aborted: Available book copies cannot drop below zero');
      }

      // 6. Check and fulfill any pending reservation the member had for this book
      const pendingReservation = await tx.reservation.findFirst({
        where: {
          bookId,
          userId,
          status: { in: [ReservationStatus.PENDING, ReservationStatus.NOTIFIED] },
        },
      });

      if (pendingReservation) {
        await tx.reservation.update({
          where: { id: pendingReservation.id },
          data: {
            status: ReservationStatus.FULFILLED,
            fulfilledAt: new Date(),
          },
        });
      }

      // 7. Calculate due date
      const borrowDate = new Date();
      const dueDate = new Date(borrowDate.getTime() + days * 24 * 60 * 60 * 1000);

      // 8. Create borrow record
      const borrowRecord = await tx.borrowRecord.create({
        data: {
          bookId,
          userId,
          borrowDate,
          dueDate,
          status: BorrowStatus.BORROWED,
        },
        include: {
          book: true,
          user: {
            select: { id: true, name: true, email: true, membershipId: true },
          },
        },
      });

      // 9. Create user notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Book Borrowed Successfully',
          message: `You borrowed "${book.title}". Please return by ${dueDate.toLocaleDateString()}.`,
          type: 'DUE_REMINDER',
        },
      });

      return {
        borrowRecord,
        availableCopiesRemaining: updatedBook.availableCopies,
      };
    });
  }

  /**
   * Transactional Return:
   * Returns a borrowed book, calculates overdue fines atomically, restores copy count,
   * and notifies the next person in the reservation queue.
   */
  static async returnBook(borrowRecordId: string) {
    return await prisma.$transaction(async (tx) => {
      const record = await tx.borrowRecord.findUnique({
        where: { id: borrowRecordId },
        include: { book: true, user: true, fines: true },
      });

      if (!record) {
        throw new Error('Borrow record not found');
      }

      if (record.status === BorrowStatus.RETURNED || record.returnDate !== null) {
        throw new Error('This book has already been returned');
      }

      const returnDate = new Date();
      let lateFine = null;

      // 1. Check if late
      if (returnDate > record.dueDate) {
        const diffMs = returnDate.getTime() - record.dueDate.getTime();
        const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const fineAmount = parseFloat((daysOverdue * DAILY_FINE_RATE).toFixed(2));

        // Check if an unpaid fine was already logged
        const existingFine = record.fines.find((f) => f.status === FineStatus.UNPAID);
        if (existingFine) {
          lateFine = await tx.fine.update({
            where: { id: existingFine.id },
            data: {
              amount: fineAmount,
              daysOverdue,
            },
          });
        } else {
          lateFine = await tx.fine.create({
            data: {
              borrowRecordId: record.id,
              userId: record.userId,
              amount: fineAmount,
              daysOverdue,
              status: FineStatus.UNPAID,
            },
          });
        }

        await tx.notification.create({
          data: {
            userId: record.userId,
            title: 'Late Return Fine Incurred',
            message: `"${record.book.title}" was returned ${daysOverdue} day(s) late. A fine of $${fineAmount.toFixed(2)} was added to your account.`,
            type: 'OVERDUE_ALERT',
          },
        });
      }

      // 2. Increment available copies
      const updatedBook = await tx.book.update({
        where: { id: record.bookId },
        data: {
          availableCopies: {
            increment: 1,
          },
        },
      });

      // 3. Mark record as returned
      const updatedRecord = await tx.borrowRecord.update({
        where: { id: borrowRecordId },
        data: {
          returnDate,
          status: BorrowStatus.RETURNED,
        },
        include: {
          book: true,
          fines: true,
        },
      });

      // 4. Check reservation queue and notify the top reservation
      const nextReservation = await tx.reservation.findFirst({
        where: {
          bookId: record.bookId,
          status: ReservationStatus.PENDING,
        },
        orderBy: { queuePosition: 'asc' },
        include: { user: true },
      });

      if (nextReservation) {
        await tx.reservation.update({
          where: { id: nextReservation.id },
          data: {
            status: ReservationStatus.NOTIFIED,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48-hour hold window
          },
        });

        await tx.notification.create({
          data: {
            userId: nextReservation.userId,
            title: 'Reserved Book Ready for Pickup!',
            message: `Good news! "${record.book.title}" is now available. Your reservation hold is valid for 48 hours.`,
            type: 'BOOK_AVAILABLE',
          },
        });
      }

      return {
        record: updatedRecord,
        fine: lateFine,
        nextReservationNotified: nextReservation ? nextReservation.user.name : null,
      };
    });
  }
}
