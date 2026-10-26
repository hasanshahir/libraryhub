import prisma from '../utils/prisma';
import { ReservationStatus, BorrowStatus } from '@prisma/client';

export class ReservationService {
  /**
   * Joins the reservation waitlist queue for a book
   */
  static async reserveBook(userId: string, bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new Error('Book not found');
    }

    // Check if user currently has an active borrow of this book
    const activeBorrow = await prisma.borrowRecord.findFirst({
      where: {
        bookId,
        userId,
        status: { in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE] },
      },
    });

    if (activeBorrow) {
      throw new Error('You already have this book checked out');
    }

    // Check if user already in reservation queue
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        bookId,
        userId,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.NOTIFIED] },
      },
    });

    if (existingReservation) {
      throw new Error(`You are already in line for this book (Queue Position #${existingReservation.queuePosition})`);
    }

    // Count existing pending reservations to set queue position
    const currentQueueCount = await prisma.reservation.count({
      where: {
        bookId,
        status: ReservationStatus.PENDING,
      },
    });

    const newPosition = currentQueueCount + 1;

    const reservation = await prisma.reservation.create({
      data: {
        bookId,
        userId,
        queuePosition: newPosition,
        status: ReservationStatus.PENDING,
      },
      include: {
        book: {
          select: { id: true, title: true, author: true, coverUrl: true, availableCopies: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: 'Book Reserved',
        message: `You are #${newPosition} in line for "${book.title}". We will alert you the moment a copy is checked in.`,
        type: 'GENERAL',
      },
    });

    return reservation;
  }

  /**
   * Cancel an active reservation and shift subsequent queue positions
   */
  static async cancelReservation(userId: string, reservationId: string, isLibrarian: boolean = false) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (!isLibrarian && reservation.userId !== userId) {
      throw new Error('Unauthorized to cancel this reservation');
    }

    if (reservation.status === ReservationStatus.CANCELLED || reservation.status === ReservationStatus.FULFILLED) {
      throw new Error('This reservation is no longer active');
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      // 1. Mark as cancelled
      const res = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: ReservationStatus.CANCELLED,
        },
      });

      // 2. Decrement positions for reservations behind this one
      await tx.reservation.updateMany({
        where: {
          bookId: reservation.bookId,
          status: ReservationStatus.PENDING,
          queuePosition: { gt: reservation.queuePosition },
        },
        data: {
          queuePosition: {
            decrement: 1,
          },
        },
      });

      return res;
    });

    return cancelled;
  }

  /**
   * Get all reservations for a specific user
   */
  static async getUserReservations(userId: string) {
    return await prisma.reservation.findMany({
      where: { userId },
      include: {
        book: true,
      },
      orderBy: { reservedAt: 'desc' },
    });
  }

  /**
   * Get all reservations for a book (Librarian/Member queue view)
   */
  static async getBookQueue(bookId: string) {
    return await prisma.reservation.findMany({
      where: {
        bookId,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.NOTIFIED] },
      },
      include: {
        user: {
          select: { id: true, name: true, membershipId: true },
        },
      },
      orderBy: { queuePosition: 'asc' },
    });
  }
}
