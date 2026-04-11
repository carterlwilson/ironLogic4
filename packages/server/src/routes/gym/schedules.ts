import express from 'express';
import {
  verifyToken,
  requireRole,
} from '../../middleware/auth.js';
import {
  getScheduleTemplates,
  getScheduleTemplateById,
  createScheduleTemplate,
  updateScheduleTemplate,
  deleteScheduleTemplate,
} from '../../controllers/scheduleTemplates.js';
import {
  getSessionsForDate,
  getSessionsByCoachDay,
  getSessionsByCoachWeek,
  getSessionById,
  deleteSession,
  deleteSessionsForWeek,
} from '../../controllers/classSessions.js';
import {
  enrollInSession,
  unenrollFromSession,
  adminEnrollClient,
  adminUnenrollClient,
} from '../../controllers/enrollments.js';
import {
  submitAttendance,
  getAttendance,
} from '../../controllers/attendance.js';
import {
  getMyDefaults,
  addDefault,
  removeDefault,
} from '../../controllers/clientDefaults.js';
import { ScheduleResetService } from '../../services/ScheduleResetService.js';
import { GenerateWeekSchema, UserType } from '@ironlogic4/shared';

const router = express.Router();

// ===== Schedule Template Routes =====

router.get(
  '/templates',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getScheduleTemplates
);

router.get(
  '/templates/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getScheduleTemplateById
);

router.post(
  '/templates',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  createScheduleTemplate
);

router.put(
  '/templates/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  updateScheduleTemplate
);

router.delete(
  '/templates/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  deleteScheduleTemplate
);

// ===== Class Sessions =====

// Week view (must come before /:id to avoid 'coach' matching as an id)
router.get(
  '/sessions/coach/week',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getSessionsByCoachWeek
);

// Day view with full roster
router.get(
  '/sessions/coach/:date',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getSessionsByCoachDay
);

// Browse sessions for a date (client-facing)
router.get('/sessions', verifyToken, getSessionsForDate);

// Single session with roster (must come after /sessions/coach/* fixed routes)
router.get(
  '/sessions/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getSessionById
);

// Delete all sessions for a week (must come before /:id)
router.delete(
  '/sessions',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  deleteSessionsForWeek
);

// Delete a session
router.delete(
  '/sessions/:id',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  deleteSession
);

// ===== Enrollments =====

router.post('/sessions/:sessionId/enroll', verifyToken, enrollInSession);

router.delete('/sessions/:sessionId/enroll', verifyToken, unenrollFromSession);

// Admin override enroll (bypasses capacity)
router.post(
  '/sessions/:sessionId/enroll/admin',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  adminEnrollClient
);

// Admin override unenroll (remove specific client)
router.delete(
  '/sessions/:sessionId/enroll/admin',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  adminUnenrollClient
);

// ===== Attendance =====

router.post(
  '/sessions/:sessionId/attendance',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  submitAttendance
);

router.get(
  '/sessions/:sessionId/attendance',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]),
  getAttendance
);

// ===== Client Default Schedules =====

router.get('/defaults', verifyToken, getMyDefaults);
router.post('/defaults', verifyToken, addDefault);
router.delete('/defaults/:id', verifyToken, removeDefault);

// ===== Session Generation =====

router.post(
  '/generate-week',
  verifyToken,
  requireRole([UserType.ADMIN, UserType.OWNER]),
  async (req, res) => {
    try {
      const validation = GenerateWeekSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ success: false, error: 'Invalid request data' });
        return;
      }
      const startDate = validation.data.startDate ? new Date(validation.data.startDate) : undefined;
      const result = await ScheduleResetService.generateWeeklySessions(startDate);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error generating weekly sessions:', error);
      res.status(500).json({ success: false, error: 'Failed to generate sessions' });
    }
  }
);

export default router;
