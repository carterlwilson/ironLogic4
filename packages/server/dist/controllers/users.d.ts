import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
/**
 * Get all users with pagination
 */
export declare const getAllUsers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get user by ID
 */
export declare const getUserById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create new user (for admin/coach creating other users)
 */
export declare const createUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update user
 */
export declare const updateUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete user
 */
export declare const deleteUser: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Reset user password (admin only)
 */
export declare const resetUserPassword: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=users.d.ts.map