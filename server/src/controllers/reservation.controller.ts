import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReservationService } from '../services/reservation.service';
import { Role } from '@prisma/client';

export class ReservationController {
  static async reserve(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { bookId } = req.body;
      const reservation = await ReservationService.reserveBook(req.user.userId, bookId);

      res.status(201).json({
        success: true,
        message: `Reserved successfully! Your waitlist position is #${reservation.queuePosition}.`,
        data: reservation,
      });
    } catch (error) {
      console.error('Reservation error:', (error as Error).message);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to place reservation',
      });
    }
  }

  static async cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { reservationId } = req.body;
      const isLibrarian = req.user.role === Role.LIBRARIAN;

      const cancelled = await ReservationService.cancelReservation(
        req.user.userId,
        reservationId,
        isLibrarian
      );

      res.json({
        success: true,
        message: 'Reservation cancelled successfully',
        data: cancelled,
      });
    } catch (error) {
      console.error('Cancel reservation error:', (error as Error).message);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Failed to cancel reservation',
      });
    }
  }

  static async getMyReservations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const list = await ReservationService.getUserReservations(req.user.userId);

      res.json({
        success: true,
        data: list,
      });
    } catch (error) {
      console.error('getMyReservations error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve reservations' });
    }
  }

  static async getBookQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { bookId } = req.params;
      const queue = await ReservationService.getBookQueue(bookId);

      res.json({
        success: true,
        data: queue,
      });
    } catch (error) {
      console.error('getBookQueue error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve queue' });
    }
  }
}
