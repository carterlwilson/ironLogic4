import express from 'express';
import { verifyToken } from '../../middleware/auth';
import {
  startProgram,
  advanceWeek,
  previousWeek,
  jumpToWeek,
  resetProgress,
  getCurrentProgress,
} from '../../controllers/programProgress';

const router = express.Router({ mergeParams: true });

// GET /api/gym/programs/:id/progress - Get current progress with metadata
// Owner/Admin access with gym scoping
router.get('/', verifyToken, getCurrentProgress);

// POST /api/gym/programs/:id/progress/start - Initialize progress tracking
// Owner/Admin access with gym scoping
router.post('/start', verifyToken, startProgram);

// POST /api/gym/programs/:id/progress/advance - Move to next week
// Owner/Admin access with gym scoping
router.post('/advance', verifyToken, advanceWeek);

// POST /api/gym/programs/:id/progress/previous - Go back one week
// Owner/Admin access with gym scoping
router.post('/previous', verifyToken, previousWeek);

// POST /api/gym/programs/:id/progress/jump - Jump to specific block/week
// Owner/Admin access with gym scoping
router.post('/jump', verifyToken, jumpToWeek);

// POST /api/gym/programs/:id/progress/reset - Reset progress to beginning
// Owner/Admin access with gym scoping
router.post('/reset', verifyToken, resetProgress);

export default router;