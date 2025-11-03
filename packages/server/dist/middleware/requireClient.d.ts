import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
/**
 * Middleware to verify user has CLIENT role
 * Must be used after verifyToken middleware
 */
export declare const requireClient: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=requireClient.d.ts.map