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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
