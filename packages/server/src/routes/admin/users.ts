import express from 'express';
import {
  verifyToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../../middleware/auth';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '../../controllers/users';

const router = express.Router();

// GET /api/users - List all users (with pagination)
// Admin only access
router.get('/', verifyToken, requireAdmin, getAllUsers);

// GET /api/users/:id - Get user by ID
// Admin only access
router.get('/:id', verifyToken, requireAdmin, getUserById);

// POST /api/users - Create new user (admin only)
router.post('/', verifyToken, requireAdmin, createUser);

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', verifyToken, requireAdmin, updateUser);

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', verifyToken, requireAdmin, deleteUser);

// POST /api/users/:id/reset-password - Reset user password (admin only)
router.post('/:id/reset-password', verifyToken, requireAdmin, resetUserPassword);

export default router;