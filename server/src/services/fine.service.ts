import prisma from '../utils/prisma';
import { BorrowStatus, FineStatus } from '@prisma/client';

const DAILY_FINE_RATE = parseFloat(process.env.DAILY_FINE_RATE || '1.50');

export class FineService {
  /**
   * Scans all active borrow records, flags overdue records, and syncs/calculates fines.
   */
  static async syncOverdueFines(): Promise<number> {
    const now = new Date();

    // 1. Find all active borrow records past their due date
    const overdueBorrows = await prisma.borrowRecord.findMany({
      where: {
        status: { in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE] },
        dueDate: { lt: now },
        returnDate: null,
      },
      include: {
        fines: true,
      },
    });

    let updatedCount = 0;

    for (const record of overdueBorrows) {
      const diffTime = Math.abs(now.getTime() - record.dueDate.getTime());
      const daysOverdue = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const fineAmount = parseFloat((daysOverdue * DAILY_FINE_RATE).toFixed(2));

      // Mark record as OVERDUE if still BORROWED
      if (record.status !== BorrowStatus.OVERDUE) {
        await prisma.borrowRecord.update({
          where: { id: record.id },
          data: { status: BorrowStatus.OVERDUE },
        });
      }

      // Check existing unpaid fine
      const existingFine = record.fines.find((f) => f.status === FineStatus.UNPAID);
      if (existingFine) {
        if (existingFine.daysOverdue !== daysOverdue) {
          await prisma.fine.update({
            where: { id: existingFine.id },
            data: {
              amount: fineAmount,
              daysOverdue,
            },
          });
          updatedCount++;
        }
      } else {
        // Create new fine
        await prisma.fine.create({
          data: {
            borrowRecordId: record.id,
            userId: record.userId,
            amount: fineAmount,
            daysOverdue,
            status: FineStatus.UNPAID,
          },
        });
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * Pay a fine
   */
  static async payFine(fineId: string, userId: string, paymentMethod: string) {
    const fine = await prisma.fine.findUnique({
      where: { id: fineId },
      include: { borrowRecord: { include: { book: true } } },
    });

    if (!fine) {
      throw new Error('Fine record not found');
    }

    if (fine.status === FineStatus.PAID) {
      throw new Error('This fine has already been paid');
    }

    const paymentRef = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updated = await prisma.fine.update({
      where: { id: fineId },
      data: {
        status: FineStatus.PAID,
        paidAt: new Date(),
        paymentReference: `${paymentMethod}:${paymentRef}`,
      },
    });

    // Create confirmation notification
    await prisma.notification.create({
      data: {
        userId: fine.userId,
        title: 'Fine Payment Received',
        message: `Your payment of $${Number(fine.amount).toFixed(2)} for "${fine.borrowRecord.book.title}" was processed. Ref: ${paymentRef}`,
        type: 'FINE_ISSUED',
      },
    });

    return updated;
  }

  /**
   * Waive a fine (Librarian only)
   */
  static async waiveFine(fineId: string, reason: string) {
    const fine = await prisma.fine.findUnique({
      where: { id: fineId },
      include: { borrowRecord: { include: { book: true } } },
    });

    if (!fine) {
      throw new Error('Fine record not found');
    }

    const updated = await prisma.fine.update({
      where: { id: fineId },
      data: {
        status: FineStatus.WAIVED,
        paymentReference: `WAIVED: ${reason}`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: fine.userId,
        title: 'Fine Waived by Library',
        message: `Your overdue fine for "${fine.borrowRecord.book.title}" was waived. Reason: ${reason}`,
        type: 'GENERAL',
      },
    });

    return updated;
  }
}
