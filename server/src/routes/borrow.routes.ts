import { Router } from 'express';
import { BorrowController } from '../controllers/borrow.controller';
import { authenticate } from '../middleware/auth';
import { requireLibrarian } from '../middleware/roles';
import { validateBody } from '../middleware/validate';
import { borrowBookSchema, returnBookSchema } from '../schemas/borrow.schema';

const router = Router();

router.post('/borrow', authenticate, validateBody(borrowBookSchema), BorrowController.borrow);
router.post('/return', authenticate, validateBody(returnBookSchema), BorrowController.returnBook);
router.get('/history', authenticate, BorrowController.getMyBorrowHistory);
router.get('/overdue', authenticate, BorrowController.getOverdueList);

// Librarian only routes
router.get('/all', authenticate, requireLibrarian, BorrowController.getAllBorrowRecords);

export default router;
