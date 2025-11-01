import { NextFunction, Request, Response } from 'express';
import { UserType } from '@ironlogic4/shared/types/users';
import { UserDocument } from '../models/User';
export interface AuthenticatedRequest extends Request {
    user?: UserDocument;
}
/**
 * Middleware to verify JWT token and attach user to request
 */
export declare const verifyToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware factory for role-based authorization
 * @param allowedRoles Array of UserType values that are allowed to access the route
 * @returns Express middleware function
 */
export declare const requireRole: (allowedRoles: UserType[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware for admin-only access (strict admin only, no other roles)
 */
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware for admin and owner access (legacy, kept for compatibility)
 */
export declare const requireAdminOrOwner: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware for admin and coach access
 */
export declare const requireAdminOrCoach: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Authorization middleware that checks if user can create/manage other users
 * Admin/Owner: can create admin/coach users
 * Coach: can create/edit/delete client users only
 */
export declare const requireUserManagementPermission: (targetUserType?: UserType) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware for gym-scoped access - owners can only access their own gym's data, admins have full access
 *
 * For OWNER/CLIENT users: Verifies they have a gym assignment (req.user.gymId exists)
 * For ADMIN users: Allows full access across all gyms
 *
 * Controllers are responsible for using req.user.gymId for gym scoping.
 */
export declare const requireOwnerOrAdminForGym: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map