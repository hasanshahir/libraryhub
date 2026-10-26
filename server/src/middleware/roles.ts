import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from './auth';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${allowedRoles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
};

export const requireLibrarian = requireRole(Role.LIBRARIAN);
export const requireMember = requireRole(Role.MEMBER, Role.LIBRARIAN);
