import express from 'express';
import {
  verifyToken,
  requireRole,
  AuthenticatedRequest,
} from '../../middleware/auth';
import {
  getScheduleTemplates,
  getScheduleTemplateById,
  createScheduleTemplate,
  updateScheduleTemplate,
  deleteScheduleTemplate,
} from '../../controllers/scheduleTemplates';
import {
  getActiveSchedules,
  getActiveScheduleById,
  createActiveSchedule,
  deleteActiveSchedule,
  resetActiveSchedule,
  assignStaff,
  unassignStaff,
} from '../../controllers/activeSchedules';
import {
  getAvailableSchedules,
  getMySchedule,
  joinTimeslot,
  leaveTimeslot,
} from '../../controllers/clientSchedules';
import { UserType } from '@ironlogic4/shared';

const router = express.Router();

// ===== Schedule Template Routes =====

// GET /api/gym/schedules/templates - List all schedule templates
// Admin/Owner/Coach access (coaches see only schedules they're assigned to)
router.get(
  '/templates',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getScheduleTemplates
);

// GET /api/gym/schedules/templates/:id - Get schedule template by ID
// Admin/Owner/Coach access (coaches can only view schedules they're assigned to)
router.get(
  '/templates/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getScheduleTemplateById
);

// POST /api/gym/schedules/templates - Create new schedule template
// Admin/Owner only
router.post(
  '/templates',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  createScheduleTemplate
);

// PUT /api/gym/schedules/templates/:id - Update schedule template
// Admin/Owner only
router.put(
  '/templates/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  updateScheduleTemplate
);

// DELETE /api/gym/schedules/templates/:id - Delete schedule template
// Admin/Owner only
router.delete(
  '/templates/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  deleteScheduleTemplate
);

// ===== Active Schedule Routes =====

// GET /api/gym/schedules/active - List all active schedules
// Admin/Owner/Coach/Client access (clients see schedules for their gym only)
router.get(
  '/active',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH, UserType.CLIENT]),
  getActiveSchedules
);

// GET /api/gym/schedules/active/:id - Get active schedule by ID
// Admin/Owner/Coach/Client access (clients can only view schedules from their gym)
router.get(
  '/active/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH, UserType.CLIENT]),
  getActiveScheduleById
);

// POST /api/gym/schedules/active - Create active schedule from template
// Admin/Owner only
router.post(
  '/active',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  createActiveSchedule
);

// DELETE /api/gym/schedules/active/:id - Delete active schedule
// Admin/Owner only
router.delete(
  '/active/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  deleteActiveSchedule
);

// POST /api/gym/schedules/active/:id/reset - Reset active schedule from template
// Admin/Owner only
router.post(
  '/active/:id/reset',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  resetActiveSchedule
);

// ===== Staff Assignment Routes =====

// POST /api/gym/schedules/active/:id/assign - Assign coach to active schedule
// Admin/Owner only
router.post(
  '/active/:id/assign',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  assignStaff
);

// DELETE /api/gym/schedules/active/:id/unassign/:coachId - Unassign coach from active schedule
// Admin/Owner only
router.delete(
  '/active/:id/unassign/:coachId',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  unassignStaff
);

// ===== Client Self-Service Routes =====

// GET /api/gym/schedules/available - Get available schedules for client self-scheduling
// All authenticated users (clients see schedules for their gym only)
router.get('/available', verifyToken, getAvailableSchedules);

// GET /api/gym/schedules/my-schedule - Get authenticated client's schedule
// All authenticated users
router.get('/my-schedule', verifyToken, getMySchedule);

// POST /api/gym/schedules/active/:id/timeslots/:timeslotId/join - Join a timeslot
// All authenticated users (with gym validation)
router.post('/active/:id/timeslots/:timeslotId/join', verifyToken, joinTimeslot);

// DELETE /api/gym/schedules/active/:id/timeslots/:timeslotId/leave - Leave a timeslot
// All authenticated users (with gym validation)
router.delete('/active/:id/timeslots/:timeslotId/leave', verifyToken, leaveTimeslot);

export default router;