import { z } from 'zod';

export const borrowBookSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  userId: z.string().optional(), // Librarian can specify a member's ID
  days: z.coerce.number().int().min(1).max(60).default(14),
});

export const returnBookSchema = z.object({
  borrowRecordId: z.string().min(1, 'Borrow record ID is required'),
});

export const payFineSchema = z.object({
  fineId: z.string().min(1, 'Fine ID is required'),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'ONLINE_MOCK']).default('ONLINE_MOCK'),
});

export const waiveFineSchema = z.object({
  fineId: z.string().min(1, 'Fine ID is required'),
  reason: z.string().trim().min(3, 'Reason must be provided').max(200),
});

export type BorrowBookInput = z.infer<typeof borrowBookSchema>;
export type ReturnBookInput = z.infer<typeof returnBookSchema>;
export type PayFineInput = z.infer<typeof payFineSchema>;
