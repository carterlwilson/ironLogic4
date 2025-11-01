import express from 'express';
import { verifyToken } from '../../middleware/auth';
import { requireClient } from '../../middleware/requireClient';
import { getCurrentWeekWorkouts } from '../../controllers/workouts';

const router = express.Router();

// All routes require authentication and CLIENT role
router.use(verifyToken);
router.use(requireClient);

// GET /api/me/workouts/current-week
router.get('/current-week', getCurrentWeekWorkouts);

export default router;