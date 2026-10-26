import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { FineService } from '../services/fine.service';
import { BorrowStatus, FineStatus, Role } from '@prisma/client';

export class DashboardController {
  /**
   * Librarian Executive Dashboard & Reports
   */
  static async getLibrarianDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Sync fines in background
      await FineService.syncOverdueFines();

      const [
        totalBooks,
        totalCopiesResult,
        activeBorrowsCount,
        overdueCount,
        totalMembers,
        finesCollectedResult,
        finesPendingResult,
        mostBorrowedRaw,
        overdueRecords,
        recentLoans,
      ] = await Promise.all([
        // Total unique titles
        prisma.book.count(),
        // Total copies & available copies
        prisma.book.aggregate({
          _sum: { totalCopies: true, availableCopies: true },
        }),
        // Active loans
        prisma.borrowRecord.count({
          where: { status: BorrowStatus.BORROWED },
        }),
        // Overdue loans
        prisma.borrowRecord.count({
          where: { status: BorrowStatus.OVERDUE },
        }),
        // Active members
        prisma.user.count({
          where: { role: Role.MEMBER, isActive: true },
        }),
        // Total fines collected
        prisma.fine.aggregate({
          where: { status: FineStatus.PAID },
          _sum: { amount: true },
        }),
        // Total fines unpaid
        prisma.fine.aggregate({
          where: { status: FineStatus.UNPAID },
          _sum: { amount: true },
        }),
        // Most borrowed books
        prisma.borrowRecord.groupBy({
          by: ['bookId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 6,
        }),
        // Overdue list (top 10)
        prisma.borrowRecord.findMany({
          where: { status: BorrowStatus.OVERDUE },
          include: {
            book: true,
            user: { select: { id: true, name: true, email: true, membershipId: true, phone: true } },
            fines: true,
          },
          orderBy: { dueDate: 'asc' },
          take: 10,
        }),
        // Recent 5 borrow transactions
        prisma.borrowRecord.findMany({
          include: {
            book: { select: { id: true, title: true, author: true } },
            user: { select: { id: true, name: true, membershipId: true } },
          },
          orderBy: { borrowDate: 'desc' },
          take: 5,
        }),
      ]);

      // Fetch book details for the most borrowed IDs
      const bookIds = mostBorrowedRaw.map((b) => b.bookId);
      const booksMap = await prisma.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true, title: true, author: true, category: true, coverUrl: true },
      });

      const mostBorrowedBooks = mostBorrowedRaw.map((item) => {
        const book = booksMap.find((b) => b.id === item.bookId);
        return {
          bookId: item.bookId,
          borrowCount: item._count.id,
          title: book?.title || 'Unknown Title',
          author: book?.author || 'Unknown Author',
          category: book?.category || 'General',
          coverUrl: book?.coverUrl,
        };
      });

      res.json({
        success: true,
        data: {
          metrics: {
            totalBooks,
            totalCopies: totalCopiesResult._sum.totalCopies || 0,
            availableCopies: totalCopiesResult._sum.availableCopies || 0,
            activeBorrowsCount,
            overdueCount,
            totalMembers,
            finesCollected: Number(finesCollectedResult._sum.amount || 0),
            finesPending: Number(finesPendingResult._sum.amount || 0),
          },
          mostBorrowedBooks,
          overdueRecords,
          recentLoans,
        },
      });
    } catch (error) {
      console.error('getLibrarianDashboard error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve dashboard metrics' });
    }
  }

  /**
   * Member dashboard summary
   */
  static async getMemberDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await FineService.syncOverdueFines();

      const [activeLoans, overdueLoans, pendingReservations, unpaidFines, notifications] =
        await Promise.all([
          prisma.borrowRecord.findMany({
            where: { userId: req.user.userId, status: BorrowStatus.BORROWED },
            include: { book: true },
            orderBy: { dueDate: 'asc' },
          }),
          prisma.borrowRecord.findMany({
            where: { userId: req.user.userId, status: BorrowStatus.OVERDUE },
            include: { book: true, fines: true },
            orderBy: { dueDate: 'asc' },
          }),
          prisma.reservation.findMany({
            where: { userId: req.user.userId, status: { in: ['PENDING', 'NOTIFIED'] } },
            include: { book: true },
            orderBy: { reservedAt: 'desc' },
          }),
          prisma.fine.findMany({
            where: { userId: req.user.userId, status: FineStatus.UNPAID },
            include: { borrowRecord: { include: { book: true } } },
          }),
          prisma.notification.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
        ]);

      const totalUnpaidFines = unpaidFines.reduce((acc, f) => acc + Number(f.amount), 0);

      res.json({
        success: true,
        data: {
          activeLoans,
          overdueLoans,
          pendingReservations,
          unpaidFines,
          totalUnpaidFines: parseFloat(totalUnpaidFines.toFixed(2)),
          notifications,
        },
      });
    } catch (error) {
      console.error('getMemberDashboard error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve member dashboard' });
    }
  }
}
