import express from 'express';
import {
  verifyToken,
  requireRole,
  AuthenticatedRequest,
} from '../../middleware/auth.js';
import {
  getScheduleTemplates,
  getScheduleTemplateById,
  createScheduleTemplate,
  updateScheduleTemplate,
  deleteScheduleTemplate,
  addTemplateTimeslotClient,
  removeTemplateTimeslotClient,
} from '../../controllers/scheduleTemplates.js';
import {
  getActiveSchedules,
  getActiveScheduleById,
  createActiveSchedule,
  deleteActiveSchedule,
  resetActiveSchedule,
  updateTimeslotAssignment,
  addActiveTimeslotClient,
  removeActiveTimeslotClient,
} from '../../controllers/activeSchedules.js';
import {
  getAvailableSchedules,
  getMySchedule,
  joinTimeslot,
  leaveTimeslot,
} from '../../controllers/clientSchedules.js';
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
// Admin/Owner/Coach only
router.post(
  '/templates',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  createScheduleTemplate
);

// PUT /api/gym/schedules/templates/:id - Update schedule template
// Admin/Owner/Coach only
router.put(
  '/templates/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  updateScheduleTemplate
);

// DELETE /api/gym/schedules/templates/:id - Delete schedule template
// Admin/Owner/Coach only
router.delete(
  '/templates/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  deleteScheduleTemplate
);

// POST /api/gym/schedules/templates/:id/timeslots/:timeslotId/clients - Add a client to a template timeslot
// Admin/Owner/Coach only (coaches restricted to timeslots they coach)
router.post(
  '/templates/:id/timeslots/:timeslotId/clients',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  addTemplateTimeslotClient
);

// DELETE /api/gym/schedules/templates/:id/timeslots/:timeslotId/clients/:clientId - Remove a client from a template timeslot
// Admin/Owner/Coach only (coaches restricted to timeslots they coach)
router.delete(
  '/templates/:id/timeslots/:timeslotId/clients/:clientId',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  removeTemplateTimeslotClient
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
// Admin/Owner/Coach only
router.post(
  '/active',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  createActiveSchedule
);

// DELETE /api/gym/schedules/active/:id - Delete active schedule
// Admin/Owner/Coach only
router.delete(
  '/active/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  deleteActiveSchedule
);

// POST /api/gym/schedules/active/:id/reset - Reset active schedule from template
// Admin/Owner/Coach only
router.post(
  '/active/:id/reset',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  resetActiveSchedule
);

// ===== Client Self-Service Routes =====

// GET /api/gym/schedules/available - Get available schedules for client self-scheduling
// All authenticated users (clients see schedules for their gym only)
router.get('/available', verifyToken, getAvailableSchedules);

// GET /api/gym/schedules/my-schedule - Get authenticated client's schedule
// All authenticated users
router.get('/my-schedule', verifyToken, getMySchedule);

// PUT /api/gym/schedules/active/:id/timeslots/:timeslotId - Update coaches + location for a timeslot
// Admin/Owner/Coach only
router.put(
  '/active/:id/timeslots/:timeslotId',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  updateTimeslotAssignment
);

// POST /api/gym/schedules/active/:id/timeslots/:timeslotId/clients - Add a client to an active schedule timeslot
// Admin/Owner/Coach only (coaches restricted to timeslots they coach)
router.post(
  '/active/:id/timeslots/:timeslotId/clients',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  addActiveTimeslotClient
);

// DELETE /api/gym/schedules/active/:id/timeslots/:timeslotId/clients/:clientId - Remove a client from an active schedule timeslot
// Admin/Owner/Coach only (coaches restricted to timeslots they coach)
router.delete(
  '/active/:id/timeslots/:timeslotId/clients/:clientId',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  removeActiveTimeslotClient
);

// POST /api/gym/schedules/active/:id/timeslots/:timeslotId/join - Join a timeslot
// All authenticated users (with gym validation)
router.post('/active/:id/timeslots/:timeslotId/join', verifyToken, joinTimeslot);

// DELETE /api/gym/schedules/active/:id/timeslots/:timeslotId/leave - Leave a timeslot
// All authenticated users (with gym validation)
router.delete('/active/:id/timeslots/:timeslotId/leave', verifyToken, leaveTimeslot);

export default router;