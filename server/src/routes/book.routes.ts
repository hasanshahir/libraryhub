import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { authenticate } from '../middleware/auth';
import { requireLibrarian } from '../middleware/roles';
import { validateBody, validateQuery } from '../middleware/validate';
import { createBookSchema, updateBookSchema, bookQuerySchema } from '../schemas/book.schema';

const router = Router();

// Public / Member searchable routes
router.get('/', validateQuery(bookQuerySchema), BookController.getBooks);
router.get('/categories', BookController.getCategories);
router.get('/isbn/:isbn', BookController.lookupIsbn);

// Optional auth to attach user loan/queue state if signed in
const optionalAuth = (req: any, res: any, next: any) => {
  if (req.cookies?.token || req.headers?.authorization) {
    authenticate(req, res, () => next());
  } else {
    next();
  }
};

router.get('/:id', optionalAuth, BookController.getBookById);

// Librarian only routes
router.post('/', authenticate, requireLibrarian, validateBody(createBookSchema), BookController.createBook);
router.put('/:id', authenticate, requireLibrarian, validateBody(updateBookSchema), BookController.updateBook);
router.delete('/:id', authenticate, requireLibrarian, BookController.deleteBook);

export default router;
