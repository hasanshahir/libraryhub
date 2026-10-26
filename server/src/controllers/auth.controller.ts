import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { signToken, setTokenCookie, clearTokenCookie } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';
import { FineStatus, BorrowStatus, ReservationStatus } from '@prisma/client';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role = 'MEMBER', phone } = req.body;

      // Check existing user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email address already exists',
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate membership ID
      const prefix = role === 'LIBRARIAN' ? 'LIB' : 'MEM';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const membershipId = `${prefix}-${new Date().getFullYear()}-${randomSuffix}`;

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          phone: phone || null,
          membershipId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          membershipId: true,
          phone: true,
          createdAt: true,
        },
      });

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      setTokenCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password credentials',
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'This account has been deactivated. Please contact library administration.',
        });
        return;
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      setTokenCookie(res, token);

      res.json({
        success: true,
        message: 'Logged in successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            membershipId: user.membershipId,
            phone: user.phone,
          },
          token,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    clearTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          membershipId: true,
          phone: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Compute quick stats
      const [activeBorrowsCount, unpaidFinesTotal, pendingReservationsCount] = await Promise.all([
        prisma.borrowRecord.count({
          where: {
            userId: user.id,
            status: { in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE] },
          },
        }),
        prisma.fine.aggregate({
          where: {
            userId: user.id,
            status: FineStatus.UNPAID,
          },
          _sum: { amount: true },
        }),
        prisma.reservation.count({
          where: {
            userId: user.id,
            status: { in: [ReservationStatus.PENDING, ReservationStatus.NOTIFIED] },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          user,
          stats: {
            activeBorrowsCount,
            unpaidFinesTotal: Number(unpaidFinesTotal._sum.amount || 0),
            pendingReservationsCount,
          },
        },
      });
    } catch (error) {
      console.error('getMe error:', error);
      res.status(500).json({ success: false, message: 'Server error retrieving profile' });
    }
  }
}
