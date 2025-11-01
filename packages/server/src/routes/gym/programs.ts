import express from 'express';
import {
  verifyToken,
  requireOwnerOrAdminForGym,
} from '../../middleware/auth';
import {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
} from '../../controllers/programs';
import programProgressRoutes from './programProgress';

const router = express.Router();

// GET /api/gym/programs - List all programs (with pagination and filtering)
// Owner/Admin access with gym scoping
router.get('/', verifyToken, getAllPrograms);

// GET /api/gym/programs/:id - Get program by ID
// Owner/Admin access with gym scoping
router.get('/:id', verifyToken, getProgramById);

// POST /api/gym/programs - Create new program
// Owner/Admin access with gym scoping
router.post('/', verifyToken, requireOwnerOrAdminForGym, createProgram);

// PUT /api/gym/programs/:id - Update program
// Owner/Admin access with gym scoping
router.put('/:id', verifyToken, updateProgram);

// DELETE /api/gym/programs/:id - Delete program (soft delete)
// Owner/Admin access with gym scoping
router.delete('/:id', verifyToken, deleteProgram);

// Progress tracking routes - /api/gym/programs/:id/progress/*
router.use('/:id/progress', programProgressRoutes);

export default router;