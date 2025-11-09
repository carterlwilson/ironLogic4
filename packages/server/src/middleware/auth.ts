import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {UserType} from '@ironlogic4/shared/types/users';
import {User, UserDocument} from '../models/User.js';

// Extend Express Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: UserDocument;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token is required',
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        success: false,
        error: 'JWT secret not configured',
      });
      return;
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, secret) as { userId: string };

    // Find the user in the database
    const user = await User.findById(decoded.userId).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Middleware factory for role-based authorization
 * @param allowedRoles Array of UserType values that are allowed to access the route
 * @returns Express middleware function
 */
export const requireRole = (allowedRoles: UserType[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.userType)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware for admin-only access (strict admin only, no other roles)
 */
export const requireAdmin = requireRole([UserType.ADMIN]);

/**
 * Middleware for admin and owner access (legacy, kept for compatibility)
 */
export const requireAdminOrOwner = requireRole([UserType.ADMIN, UserType.OWNER]);

/**
 * Middleware for admin and coach access
 */
export const requireAdminOrCoach = requireRole([
  UserType.ADMIN,
  UserType.OWNER,
  UserType.COACH,
]);

/**
 * Authorization middleware that checks if user can create/manage other users
 * Admin/Owner: can create admin/coach users
 * Coach: can create/edit/delete client users only
 */
export const requireUserManagementPermission = (targetUserType?: UserType) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { userType } = req.user;

    // Admin can manage all user types
    if (userType === UserType.ADMIN) {
      next();
      return;
    }

    // Owner can manage Coach and Client Types
    if (userType === UserType.OWNER) {
        if (targetUserType === UserType.CLIENT || targetUserType === UserType.COACH) {
            next();
            return;
        }
    }

    // Coach can only manage client users
    if (userType === UserType.COACH) {
      if (!targetUserType || targetUserType === UserType.CLIENT) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Coaches can only manage client users',
      });
      return;
    }

    // Clients have read-only access
    res.status(403).json({
      success: false,
      error: 'Insufficient permissions for user management',
    });
  };
};

/**
 * Extract JWT token from Authorization header
 */
function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Check for "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware for gym-scoped access - owners can only access their own gym's data, admins have full access
 *
 * For OWNER/CLIENT users: Verifies they have a gym assignment (req.user.gymId exists)
 * For ADMIN users: Allows full access across all gyms
 *
 * Controllers are responsible for using req.user.gymId for gym scoping.
 */
export const requireOwnerOrAdminForGym = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Admins have full access to all gyms
  if (user.userType === UserType.ADMIN) {
    next();
    return;
  }

  // Owners and Clients must have a gym assignment
  if (user.userType === UserType.OWNER || user.userType === UserType.CLIENT) {
    if (!user.gymId) {
      res.status(400).json({
        success: false,
        error: 'You must be assigned to a gym to perform this action',
      });
      return;
    }

    // User has a gym assignment, allow the request
    // Controllers will use req.user.gymId for gym scoping
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'Access denied. Owner or admin privileges required.',
  });
};

/**
 * Middleware for gym-scoped access - allows ADMIN, OWNER, and COACH users
 *
 * For OWNER/COACH users: Verifies they have a gym assignment (req.user.gymId exists)
 * For ADMIN users: Allows full access across all gyms
 *
 * Controllers are responsible for using req.user.gymId for gym scoping.
 */
export const requireGymStaffAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Admins have full access to all gyms
  if (user.userType === UserType.ADMIN) {
    next();
    return;
  }

  // Owners and Coaches must have a gym assignment
  if (user.userType === UserType.OWNER || user.userType === UserType.COACH) {
    if (!user.gymId) {
      res.status(400).json({
        success: false,
        error: 'You must be assigned to a gym to perform this action',
      });
      return;
    }

    // User has a gym assignment, allow the request
    // Controllers will use req.user.gymId for gym scoping
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'Access denied. Admin, owner, or coach privileges required.',
  });
};