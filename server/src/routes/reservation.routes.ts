import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createReservationSchema, cancelReservationSchema } from '../schemas/reservation.schema';

const router = Router();

router.post('/reserve', authenticate, validateBody(createReservationSchema), ReservationController.reserve);
router.post('/cancel', authenticate, validateBody(cancelReservationSchema), ReservationController.cancel);
router.get('/my', authenticate, ReservationController.getMyReservations);
router.get('/book/:bookId', authenticate, ReservationController.getBookQueue);

export default router;
