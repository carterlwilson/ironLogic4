import express from 'express';
import {
  verifyToken,
  requireRole,
} from '../../middleware/auth.js';
import {
  getClassAttendance,
  submitClassAttendance,
  getAttendanceSummary,
  getClientAttendance,
} from '../../controllers/attendance.js';
import { UserType } from '@ironlogic4/shared';

const router = express.Router();

// GET /api/gym/attendance/class - Recorded attendance for one class on one date
// Admin/Owner/Coach access (coaches only for classes they coach)
router.get(
  '/class',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getClassAttendance
);

// PUT /api/gym/attendance/class - Record attendance for a class roster on one date
// Admin/Owner/Coach access (coaches only for classes they coach)
router.put(
  '/class',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  submitClassAttendance
);

// GET /api/gym/attendance/summary - Per-client attendance counts over a date range
// Admin/Owner/Coach access
router.get(
  '/summary',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getAttendanceSummary
);

// GET /api/gym/attendance/clients/:clientId - One client's attendance history
// Admin/Owner/Coach access
router.get(
  '/clients/:clientId',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getClientAttendance
);

export default router;
