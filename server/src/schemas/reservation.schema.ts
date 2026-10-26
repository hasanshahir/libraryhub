import { z } from 'zod';

export const createReservationSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
});

export const cancelReservationSchema = z.object({
  reservationId: z.string().min(1, 'Reservation ID is required'),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
