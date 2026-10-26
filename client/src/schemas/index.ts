import { z } from 'zod';

export const RoleEnum = z.enum(['LIBRARIAN', 'MEMBER']);
export type Role = z.infer<typeof RoleEnum>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: RoleEnum.default('MEMBER'),
  phone: z.string().trim().optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const createBookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  author: z.string().trim().min(1, 'Author is required').max(255),
  isbn: z.string().trim().min(9, 'ISBN must be at least 9 characters').max(20),
  category: z.string().trim().min(1, 'Category is required').max(100),
  description: z.string().trim().optional().or(z.literal('')),
  coverUrl: z.string().trim().url('Must be a valid URL').optional().or(z.literal('')),
  publishYear: z.coerce.number().int().min(1000).max(new Date().getFullYear() + 2).optional(),
  publisher: z.string().trim().optional().or(z.literal('')),
  totalCopies: z.coerce.number().int().min(1, 'Must have at least 1 copy').default(1),
});

export const updateBookSchema = createBookSchema.partial();

export const borrowBookSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  userId: z.string().optional(),
  days: z.coerce.number().int().min(1).max(60).default(14),
});

export const createReservationSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BorrowBookInput = z.infer<typeof borrowBookSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
