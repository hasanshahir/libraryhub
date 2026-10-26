import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { OpenLibraryService } from '../services/openlibrary.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { BorrowStatus, ReservationStatus } from '@prisma/client';

export class BookController {
  /**
   * Search catalogue with filters, pagination, and sorting
   */
  static async getBooks(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        category,
        availableOnly,
        page = 1,
        limit = 12,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as any;

      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const where: any = {};

      if (category && category !== 'All') {
        where.category = {
          equals: String(category),
          mode: 'insensitive',
        };
      }

      if (availableOnly === true || availableOnly === 'true') {
        where.availableCopies = { gt: 0 };
      }

      if (search && String(search).trim() !== '') {
        const query = String(search).trim();
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
          { isbn: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ];
      }

      const [totalBooks, books] = await Promise.all([
        prisma.book.count({ where }),
        prisma.book.findMany({
          where,
          take,
          skip,
          orderBy: {
            [String(sortBy)]: sortOrder === 'asc' ? 'asc' : 'desc',
          },
          include: {
            _count: {
              select: {
                borrowRecords: {
                  where: { status: { in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE] } },
                },
                reservations: {
                  where: { status: ReservationStatus.PENDING },
                },
              },
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          books,
          pagination: {
            totalBooks,
            totalPages: Math.ceil(totalBooks / take),
            currentPage: Number(page),
            pageSize: take,
          },
        },
      });
    } catch (error) {
      console.error('getBooks error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve books' });
    }
  }

  /**
   * Get distinct categories with book count
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await prisma.book.groupBy({
        by: ['category'],
        _count: {
          id: true,
        },
        orderBy: {
          category: 'asc',
        },
      });

      res.json({
        success: true,
        data: categories.map((c) => ({
          name: c.category,
          count: c._count.id,
        })),
      });
    } catch (error) {
      console.error('getCategories error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve categories' });
    }
  }

  /**
   * Get book details by ID
   */
  static async getBookById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const book = await prisma.book.findUnique({
        where: { id },
        include: {
          reservations: {
            where: { status: ReservationStatus.PENDING },
            orderBy: { queuePosition: 'asc' },
            select: { id: true, queuePosition: true, reservedAt: true, userId: true },
          },
        },
      });

      if (!book) {
        res.status(404).json({ success: false, message: 'Book not found' });
        return;
      }

      // Check if logged-in user is currently borrowing or reserving
      let userStatus: any = { isBorrowing: false, isReserved: false, queuePosition: null };
      if (req.user) {
        const activeBorrow = await prisma.borrowRecord.findFirst({
          where: {
            bookId: id,
            userId: req.user.userId,
            status: { in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE] },
          },
        });

        const activeReservation = await prisma.reservation.findFirst({
          where: {
            bookId: id,
            userId: req.user.userId,
            status: { in: [ReservationStatus.PENDING, ReservationStatus.NOTIFIED] },
          },
        });

        userStatus = {
          isBorrowing: !!activeBorrow,
          borrowRecordId: activeBorrow?.id,
          isReserved: !!activeReservation,
          reservationId: activeReservation?.id,
          queuePosition: activeReservation?.queuePosition,
        };
      }

      res.json({
        success: true,
        data: {
          book,
          userStatus,
        },
      });
    } catch (error) {
      console.error('getBookById error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve book details' });
    }
  }

  /**
   * Create a new book (Librarian only)
   */
  static async createBook(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        author,
        isbn,
        category,
        description,
        coverUrl,
        publishYear,
        publisher,
        totalCopies,
      } = req.body;

      const existing = await prisma.book.findUnique({
        where: { isbn },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: `A book with ISBN ${isbn} already exists ("${existing.title}")`,
        });
        return;
      }

      const book = await prisma.book.create({
        data: {
          title,
          author,
          isbn,
          category,
          description: description || null,
          coverUrl: coverUrl || null,
          publishYear: publishYear ? Number(publishYear) : null,
          publisher: publisher || null,
          totalCopies: Number(totalCopies) || 1,
          availableCopies: Number(totalCopies) || 1,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Book added to catalogue successfully',
        data: book,
      });
    } catch (error) {
      console.error('createBook error:', error);
      res.status(500).json({ success: false, message: 'Failed to create book' });
    }
  }

  /**
   * Update book (Librarian only)
   */
  static async updateBook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = { ...req.body };

      const existing = await prisma.book.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({ success: false, message: 'Book not found' });
        return;
      }

      // If totalCopies is changed, recalculate availableCopies
      if (data.totalCopies !== undefined) {
        const difference = Number(data.totalCopies) - existing.totalCopies;
        const newAvailable = existing.availableCopies + difference;
        if (newAvailable < 0) {
          res.status(400).json({
            success: false,
            message: `Cannot reduce total copies below currently borrowed count (${existing.totalCopies - existing.availableCopies} copies currently on loan)`,
          });
          return;
        }
        data.availableCopies = newAvailable;
      }

      const updated = await prisma.book.update({
        where: { id },
        data,
      });

      res.json({
        success: true,
        message: 'Book updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('updateBook error:', error);
      res.status(500).json({ success: false, message: 'Failed to update book' });
    }
  }

  /**
   * Delete book (Librarian only)
   */
  static async deleteBook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const activeBorrows = await prisma.borrowRecord.count({
        where: {
          bookId: id,
          status: { in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE] },
        },
      });

      if (activeBorrows > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete book: ${activeBorrows} copies are currently on loan. Books can only be deleted once all copies are returned.`,
        });
        return;
      }

      await prisma.book.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Book removed from catalogue',
      });
    } catch (error) {
      console.error('deleteBook error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete book' });
    }
  }

  /**
   * Open Library API lookup
   */
  static async lookupIsbn(req: Request, res: Response): Promise<void> {
    try {
      const { isbn } = req.params;
      const metadata = await OpenLibraryService.lookupByIsbn(isbn);

      if (!metadata) {
        res.status(404).json({
          success: false,
          message: 'No book found on Open Library for this ISBN. You can still enter details manually.',
        });
        return;
      }

      res.json({
        success: true,
        data: metadata,
      });
    } catch (error) {
      console.error('lookupIsbn error:', error);
      res.status(500).json({ success: false, message: 'Failed to lookup ISBN' });
    }
  }
}
