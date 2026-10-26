import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { Role, BorrowStatus, FineStatus } from '@prisma/client';

export class UserController {
  /**
   * Get all members (Librarian only)
   */
  static async getMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { search, page = 1, limit = 20 } = req.query as any;

      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const where: any = { role: Role.MEMBER };

      if (search && String(search).trim() !== '') {
        const query = String(search).trim();
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { membershipId: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ];
      }

      const [totalMembers, members] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          take,
          skip,
          select: {
            id: true,
            name: true,
            email: true,
            membershipId: true,
            phone: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                borrowRecords: {
                  where: { status: { in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE] } },
                },
                fines: {
                  where: { status: FineStatus.UNPAID },
                },
              },
            },
            fines: {
              where: { status: FineStatus.UNPAID },
              select: { amount: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const formattedMembers = members.map((m) => {
        const totalUnpaid = m.fines.reduce((acc, f) => acc + Number(f.amount), 0);
        return {
          id: m.id,
          name: m.name,
          email: m.email,
          membershipId: m.membershipId,
          phone: m.phone,
          isActive: m.isActive,
          createdAt: m.createdAt,
          activeLoansCount: m._count.borrowRecords,
          unpaidFinesCount: m._count.fines,
          totalUnpaidFines: parseFloat(totalUnpaid.toFixed(2)),
        };
      });

      res.json({
        success: true,
        data: {
          members: formattedMembers,
          pagination: {
            totalMembers,
            totalPages: Math.ceil(totalMembers / take),
            currentPage: Number(page),
            pageSize: take,
          },
        },
      });
    } catch (error) {
      console.error('getMembers error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve members' });
    }
  }

  /**
   * Get member details by ID with their complete record (Librarian only)
   */
  static async getMemberById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const member = await prisma.user.findUnique({
        where: { id },
        include: {
          borrowRecords: {
            include: { book: true, fines: true },
            orderBy: { borrowDate: 'desc' },
          },
          fines: {
            include: { borrowRecord: { include: { book: true } } },
            orderBy: { createdAt: 'desc' },
          },
          reservations: {
            include: { book: true },
            orderBy: { reservedAt: 'desc' },
          },
        },
      });

      if (!member) {
        res.status(404).json({ success: false, message: 'Member not found' });
        return;
      }

      res.json({
        success: true,
        data: member,
      });
    } catch (error) {
      console.error('getMemberById error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve member details' });
    }
  }

  /**
   * Toggle active status of member (Librarian only)
   */
  static async toggleMemberStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (user.role === Role.LIBRARIAN) {
        res.status(400).json({ success: false, message: 'Cannot deactivate librarian accounts' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: { id: true, name: true, email: true, isActive: true },
      });

      res.json({
        success: true,
        message: `Member account ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
        data: updated,
      });
    } catch (error) {
      console.error('toggleMemberStatus error:', error);
      res.status(500).json({ success: false, message: 'Failed to update member status' });
    }
  }
}
