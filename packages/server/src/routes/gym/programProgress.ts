import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {
  updateProgress,
  advanceWeek,
  getCurrentProgress,
} from '../../controllers/programProgress.js';

const router = express.Router({ mergeParams: true });

// GET /api/gym/programs/:id/progress - Get current progress with metadata
// Owner/Admin access with gym scoping
router.get('/', verifyToken, getCurrentProgress);

// PUT /api/gym/programs/:id/progress - Update progress to specific block/week
// Owner/Admin access with gym scoping
router.put('/', verifyToken, updateProgress);

// POST /api/gym/programs/:id/progress/advance - Move to next week
// Owner/Admin access with gym scoping
router.post('/advance', verifyToken, advanceWeek);

export default router;