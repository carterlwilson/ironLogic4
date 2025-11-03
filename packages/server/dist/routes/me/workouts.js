import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import { requireClient } from '../../middleware/requireClient.js';
import { getCurrentWeekWorkouts } from '../../controllers/workouts.js';
const router = express.Router();
// All routes require authentication and CLIENT role
router.use(verifyToken);
router.use(requireClient);
// GET /api/me/workouts/current-week
router.get('/current-week', getCurrentWeekWorkouts);
export default router;
//# sourceMappingURL=workouts.js.map