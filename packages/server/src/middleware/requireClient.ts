import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserType } from '@ironlogic4/shared';

/**
 * Middleware to verify user has CLIENT role
 * Must be used after verifyToken middleware
 */
export const requireClient = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.userType !== UserType.CLIENT) {
    res.status(403).json({
      success: false,
      error: 'This endpoint is only accessible to clients',
    });
    return;
  }

  next();
};