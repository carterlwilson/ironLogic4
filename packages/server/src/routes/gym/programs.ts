import express from 'express';
import {
  verifyToken,
  requireGymStaffAccess,
  requireAdminOrOwner,
} from '../../middleware/auth.js';
import {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  assignProgramToAllClients,
} from '../../controllers/programs.js';
import programProgressRoutes from './programProgress.js';

const router = express.Router();

// GET /api/gym/programs - List all programs (with pagination and filtering)
// Owner/Admin access with gym scoping
router.get('/', verifyToken, getAllPrograms);

// GET /api/gym/programs/:id - Get program by ID
// Owner/Admin access with gym scoping
router.get('/:id', verifyToken, getProgramById);

// POST /api/gym/programs - Create new program
// Gym staff access with gym scoping
router.post('/', verifyToken, requireGymStaffAccess, createProgram);

// PUT /api/gym/programs/:id - Update program
// Owner/Admin access with gym scoping
router.put('/:id', verifyToken, updateProgram);

// DELETE /api/gym/programs/:id - Delete program (soft delete)
// Owner/Admin access with gym scoping
router.delete('/:id', verifyToken, deleteProgram);

// POST /api/gym/programs/:id/assign-all-clients - Assign program to every client in the gym
// Owner/Admin access with gym scoping
router.post('/:id/assign-all-clients', verifyToken, requireAdminOrOwner, assignProgramToAllClients);

// Progress tracking routes - /api/gym/programs/:id/progress/*
router.use('/:id/progress', programProgressRoutes);

export default router;