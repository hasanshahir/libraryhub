import { Router } from 'express';
import { FineController } from '../controllers/fine.controller';
import { authenticate } from '../middleware/auth';
import { requireLibrarian } from '../middleware/roles';
import { validateBody } from '../middleware/validate';
import { payFineSchema, waiveFineSchema } from '../schemas/borrow.schema';

const router = Router();

router.get('/my', authenticate, FineController.getMyFines);
router.post('/pay', authenticate, validateBody(payFineSchema), FineController.payFine);

// Librarian only routes
router.get('/all', authenticate, requireLibrarian, FineController.getAllFines);
router.post('/waive', authenticate, requireLibrarian, validateBody(waiveFineSchema), FineController.waiveFine);

export default router;
