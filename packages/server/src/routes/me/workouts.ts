import express from 'express';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import { UserType } from '@ironlogic4/shared';
import { getCurrentWeekWorkouts } from '../../controllers/workouts.js';

const router = express.Router();

// All routes require authentication and CLIENT or COACH role (coaches track their own workouts too)
router.use(verifyToken);
router.use(requireRole([UserType.CLIENT, UserType.COACH]));

// GET /api/me/workouts/current-week
router.get('/current-week', getCurrentWeekWorkouts);

export default router;