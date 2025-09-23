import express from 'express';
import {
  verifyToken,
  requireUserManagementPermission,
  AuthenticatedRequest,
} from '../middleware/auth';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/users';
import { User } from '../models/User';
import { UserType } from '@ironlogic4/shared/types/users';

const router = express.Router();

/**
 * Middleware to determine target user type for permission checking
 * This is used for PUT and DELETE operations where we need to check
 * what type of user is being modified
 */
const getTargetUserType = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Store the target user type for the permission middleware
    (req as any).targetUserType = targetUser.userType;
    next();
  } catch (error) {
    console.error('Error fetching target user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate user permissions',
    });
  }
};

/**
 * Middleware to get target user type from request body for POST operations
 */
const getTargetUserTypeFromBody = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
): void => {
  const { userType } = req.body;
  if (userType) {
    (req as any).targetUserType = userType;
  }
  next();
};

/**
 * Dynamic permission middleware that uses the target user type
 */
const requireUserManagementForTarget = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
): void => {
  const targetUserType = (req as any).targetUserType as UserType;
  requireUserManagementPermission(targetUserType)(req, res, next);
};

// GET /api/users - List all users (with pagination)
// All authenticated users can access
router.get('/', verifyToken, getAllUsers);

// GET /api/users/:id - Get user by ID
// All authenticated users can access
router.get('/:id', verifyToken, getUserById);

// POST /api/users - Create new user (admin/coach creating other users)
// Use middleware to check permissions based on the userType in request body
router.post(
  '/',
  verifyToken,
  getTargetUserTypeFromBody,
  requireUserManagementForTarget,
  createUser
);

// PUT /api/users/:id - Update user
// Use requireUserManagementPermission(targetUserType) middleware where targetUserType
// is determined from the user being modified
router.put(
  '/:id',
  verifyToken,
  getTargetUserType,
  requireUserManagementForTarget,
  updateUser
);

// DELETE /api/users/:id - Delete user
// Use requireUserManagementPermission(targetUserType) middleware where targetUserType
// is determined from the user being modified
router.delete(
  '/:id',
  verifyToken,
  getTargetUserType,
  requireUserManagementForTarget,
  deleteUser
);

export default router;