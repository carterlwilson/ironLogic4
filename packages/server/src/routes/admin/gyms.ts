import { Router } from 'express';
import {
  getAllGyms,
  getGymById,
  createGym,
  updateGym,
  deleteGym,
} from '../../controllers/gyms';
import { verifyToken, requireAdmin } from '../../middleware/auth';

const router = Router();

// Apply authentication and admin requirement to all routes
router.use(verifyToken, requireAdmin);

// GET /api/admin/gyms - Get all gyms with pagination and filtering
router.get('/', getAllGyms);

// GET /api/admin/gyms/:id - Get specific gym by ID
router.get('/:id', getGymById);

// POST /api/admin/gyms - Create new gym
router.post('/', createGym);

// PUT /api/admin/gyms/:id - Update gym
router.put('/:id', updateGym);

// DELETE /api/admin/gyms/:id - Delete gym
router.delete('/:id', deleteGym);

export default router;