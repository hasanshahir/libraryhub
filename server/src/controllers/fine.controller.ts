import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { FineService } from '../services/fine.service';
import prisma from '../utils/prisma';
import { FineStatus, Role } from '@prisma/client';

export class FineController {
  /**
   * Get user's fines
   */
  static async getMyFines(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await FineService.syncOverdueFines();

      const fines = await prisma.fine.findMany({
        where: { userId: req.user.userId },
        include: {
          borrowRecord: {
            include: { book: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalUnpaid = fines
        .filter((f) => f.status === FineStatus.UNPAID)
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      res.json({
        success: true,
        data: {
          fines,
          totalUnpaid: parseFloat(totalUnpaid.toFixed(2)),
        },
      });
    } catch (error) {
      console.error('getMyFines error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve fines' });
    }
  }

  /**
   * Get all library fines (Librarian only)
   */
  static async getAllFines(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query as any;

      await FineService.syncOverdueFines();

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status as FineStatus;
      }

      const fines = await prisma.fine.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, membershipId: true },
          },
          borrowRecord: {
            include: { book: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalCollected = await prisma.fine.aggregate({
        where: { status: FineStatus.PAID },
        _sum: { amount: true },
      });

      const totalPending = await prisma.fine.aggregate({
        where: { status: FineStatus.UNPAID },
        _sum: { amount: true },
      });

      res.json({
        success: true,
        data: {
          fines,
          stats: {
            totalCollected: Number(totalCollected._sum.amount || 0),
            totalPending: Number(totalPending._sum.amount || 0),
          },
        },
      });
    } catch (error) {
      console.error('getAllFines error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve library fines' });
    }
  }

  /**
   * Pay a fine
   */
  static async payFine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { fineId, paymentMethod = 'ONLINE_MOCK' } = req.body;

      const fine = await prisma.fine.findUnique({
        where: { id: fineId },
      });

      if (!fine) {
        res.status(404).json({ success: false, message: 'Fine record not found' });
        return;
      }

      if (req.user.role !== Role.LIBRARIAN && fine.userId !== req.user.userId) {
        res.status(403).json({ success: false, message: 'Unauthorized to pay fine for another user' });
        return;
      }

      const updated = await FineService.payFine(fineId, req.user.userId, paymentMethod);

      res.json({
        success: true,
        message: 'Fine paid successfully',
        data: updated,
      });
    } catch (error) {
      console.error('payFine error:', (error as Error).message);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to pay fine',
      });
    }
  }

  /**
   * Waive a fine (Librarian only)
   */
  static async waiveFine(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fineId, reason } = req.body;

      const updated = await FineService.waiveFine(fineId, reason);

      res.json({
        success: true,
        message: 'Fine waived successfully',
        data: updated,
      });
    } catch (error) {
      console.error('waiveFine error:', (error as Error).message);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to waive fine',
      });
    }
  }
}
