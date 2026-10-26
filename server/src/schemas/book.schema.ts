import { z } from 'zod';

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

export const bookQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  availableOnly: z.enum(['true', 'false']).optional().transform((val) => val === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sortBy: z.enum(['title', 'author', 'createdAt', 'availableCopies']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BookQueryParams = z.infer<typeof bookQuerySchema>;
