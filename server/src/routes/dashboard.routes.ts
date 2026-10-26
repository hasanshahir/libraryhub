import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { requireLibrarian } from '../middleware/roles';

const router = Router();

router.get('/librarian', authenticate, requireLibrarian, DashboardController.getLibrarianDashboard);
router.get('/member', authenticate, DashboardController.getMemberDashboard);

export default router;
