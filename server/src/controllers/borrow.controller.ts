import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { BorrowService } from '../services/borrow.service';
import { FineService } from '../services/fine.service';
import prisma from '../utils/prisma';
import { BorrowStatus, Role } from '@prisma/client';

export class BorrowController {
  /**
   * Borrow a book (Member checks out or Librarian checks out for member)
   */
  static async borrow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { bookId, userId: targetUserId, days = 14 } = req.body;

      // If user is a MEMBER, they can only borrow for themselves
      let borrowerId = req.user.userId;
      if (req.user.role === Role.LIBRARIAN && targetUserId) {
        borrowerId = targetUserId;
      }

      const result = await BorrowService.borrowBook(borrowerId, bookId, Number(days));

      res.status(201).json({
        success: true,
        message: 'Book borrowed successfully',
        data: result,
      });
    } catch (error) {
      console.error('Borrow error:', (error as Error).message);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to borrow book',
      });
    }
  }

  /**
   * Return a borrowed book
   */
  static async returnBook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { borrowRecordId } = req.body;

      const record = await prisma.borrowRecord.findUnique({
        where: { id: borrowRecordId },
      });

      if (!record) {
        res.status(404).json({ success: false, message: 'Borrow record not found' });
        return;
      }

      // If not librarian, member can only return their own book
      if (req.user?.role !== Role.LIBRARIAN && record.userId !== req.user?.userId) {
        res.status(403).json({ success: false, message: 'Unauthorized to return this book' });
        return;
      }

      const result = await BorrowService.returnBook(borrowRecordId);

      res.json({
        success: true,
        message: result.fine
          ? `Book returned successfully. Late fine of $${Number(result.fine.amount).toFixed(2)} incurred.`
          : 'Book returned successfully on time.',
        data: result,
      });
    } catch (error) {
      console.error('Return error:', (error as Error).message);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to return book',
      });
    }
  }

  /**
   * Current user's borrowing history
   */
  static async getMyBorrowHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Sync overdue fines before reading
      await FineService.syncOverdueFines();

      const records = await prisma.borrowRecord.findMany({
        where: { userId: req.user.userId },
        include: {
          book: true,
          fines: true,
        },
        orderBy: { borrowDate: 'desc' },
      });

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      console.error('getMyBorrowHistory error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve borrow history' });
    }
  }

  /**
   * All borrow records (Librarian view with filters)
   */
  static async getAllBorrowRecords(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, page = 1, limit = 20 } = req.query as any;

      await FineService.syncOverdueFines();

      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status as BorrowStatus;
      }

      const [totalRecords, records] = await Promise.all([
        prisma.borrowRecord.count({ where }),
        prisma.borrowRecord.findMany({
          where,
          take,
          skip,
          include: {
            book: true,
            user: {
              select: { id: true, name: true, email: true, membershipId: true },
            },
            fines: true,
          },
          orderBy: { borrowDate: 'desc' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          records,
          pagination: {
            totalRecords,
            totalPages: Math.ceil(totalRecords / take),
            currentPage: Number(page),
            pageSize: take,
          },
        },
      });
    } catch (error) {
      console.error('getAllBorrowRecords error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve borrow records' });
    }
  }

  /**
   * Overdue list
   */
  static async getOverdueList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await FineService.syncOverdueFines();

      const where: any = {
        status: BorrowStatus.OVERDUE,
      };

      if (req.user?.role !== Role.LIBRARIAN) {
        where.userId = req.user?.userId;
      }

      const overdueRecords = await prisma.borrowRecord.findMany({
        where,
        include: {
          book: true,
          user: {
            select: { id: true, name: true, email: true, membershipId: true, phone: true },
          },
          fines: true,
        },
        orderBy: { dueDate: 'asc' },
      });

      res.json({
        success: true,
        data: overdueRecords,
      });
    } catch (error) {
      console.error('getOverdueList error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve overdue list' });
    }
  }
}
