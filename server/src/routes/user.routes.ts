import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireLibrarian } from '../middleware/roles';

const router = Router();

router.get('/members', authenticate, requireLibrarian, UserController.getMembers);
router.get('/members/:id', authenticate, requireLibrarian, UserController.getMemberById);
router.patch('/members/:id/toggle', authenticate, requireLibrarian, UserController.toggleMemberStatus);

export default router;
