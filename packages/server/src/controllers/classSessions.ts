import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ClassSession } from '../models/ClassSession.js';
import { Enrollment } from '../models/Enrollment.js';
import { User } from '../models/User.js';
import { ApiResponse, ClassSessionQuerySchema, WeekViewQuerySchema, UserType } from '@ironlogic4/shared';
import { z } from 'zod';

const IdParamSchema = z.object({
  id: z.string().min(1),
});

const DateParamSchema = z.object({
  date: z.string().min(1),
});

/**
 * GET /sessions
 * Browse sessions for a given date. Optionally filter by coachId, period, or startTime.
 * Returns each session with enrolled count and available spots.
 */
export const getSessionsForDate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const queryValidation = ClassSessionQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid query parameters' });
      return;
    }

    const { date, coachId, period, startTime } = queryValidation.data;

    const gymId = req.user?.gymId;
    if (!gymId) {
      res.status(400).json({ success: false, error: 'You must be assigned to a gym' });
      return;
    }

    const query: any = { gymId };

    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    if (coachId) query.coachId = coachId;
    if (period) query.period = period;
    if (startTime) query.startTime = startTime;

    const sessions = await ClassSession.find(query).sort({ date: 1, startTime: 1 });

    // Fetch enrolled counts in bulk
    const sessionIds = sessions.map(s => s.id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { sessionId: { $in: sessionIds }, status: 'enrolled' } },
      { $group: { _id: '$sessionId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(enrollmentCounts.map((e: any) => [e._id, e.count]));

    // Fetch coach names in bulk
    const coachIds = [...new Set(sessions.map(s => s.coachId))];
    const coaches = await User.find({ _id: { $in: coachIds } }).select('_id firstName lastName');
    const coachMap = new Map(coaches.map(c => [c.id, { firstName: c.firstName, lastName: c.lastName }]));

    const data = sessions.map(s => {
      const enrolled = countMap.get(s.id) ?? 0;
      return {
        ...s.toJSON(),
        enrolledCount: enrolled,
        availableSpots: s.maxCapacity - enrolled,
        coach: coachMap.get(s.coachId),
      };
    });

    const response: ApiResponse<typeof data> = { success: true, data };
    res.json(response);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
};

/**
 * GET /sessions/coach/:date
 * Returns a coach's sessions for a specific date with full roster (enrolled client names).
 * Coaches see only their own sessions; admins/owners see all.
 */
export const getSessionsByCoachDay = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = DateParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid date parameter' });
      return;
    }

    const { date } = paramValidation.data;
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 1);

    const gymId = req.user?.gymId;
    if (!gymId) {
      res.status(400).json({ success: false, error: 'You must be assigned to a gym' });
      return;
    }

    const query: any = { gymId, date: { $gte: start, $lt: end } };
    if (req.user?.userType === UserType.COACH) {
      query.coachId = req.user.id;
    }

    const sessions = await ClassSession.find(query).sort({ startTime: 1 });

    const data = await Promise.all(
      sessions.map(async session => {
        const enrollments = await Enrollment.find({
          sessionId: session.id,
          status: 'enrolled',
        });

        const clientIds = enrollments.map(e => e.clientId);
        const clients = await User.find({ _id: { $in: clientIds } }).select('_id firstName lastName');
        const clientMap = new Map(clients.map(c => [c.id, { id: c.id, firstName: c.firstName, lastName: c.lastName }]));

        return {
          ...session.toJSON(),
          roster: enrollments.map(e => ({
            enrollmentId: e.id,
            source: e.source,
            client: clientMap.get(e.clientId),
          })),
        };
      })
    );

    const response: ApiResponse<typeof data> = { success: true, data };
    res.json(response);
  } catch (error) {
    console.error('Error fetching coach day sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
};

/**
 * GET /sessions/coach/week?startDate=
 * Returns sessions for the week starting at startDate, with enrolled counts per session.
 * Coaches see only their own sessions; admins/owners see all.
 */
export const getSessionsByCoachWeek = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const queryValidation = WeekViewQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(400).json({ success: false, error: 'startDate is required' });
      return;
    }

    const gymId = req.user?.gymId;
    if (!gymId) {
      res.status(400).json({ success: false, error: 'You must be assigned to a gym' });
      return;
    }

    const weekStart = new Date(queryValidation.data.startDate);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const query: any = { gymId, date: { $gte: weekStart, $lt: weekEnd } };
    if (req.user?.userType === UserType.COACH) {
      query.coachId = req.user.id;
    }

    const sessions = await ClassSession.find(query).sort({ date: 1, startTime: 1 });

    const sessionIds = sessions.map(s => s.id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { sessionId: { $in: sessionIds }, status: 'enrolled' } },
      { $group: { _id: '$sessionId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(enrollmentCounts.map((e: any) => [e._id, e.count]));

    const data = sessions.map(s => ({
      ...s.toJSON(),
      enrolledCount: countMap.get(s.id) ?? 0,
    }));

    const response: ApiResponse<typeof data> = { success: true, data };
    res.json(response);
  } catch (error) {
    console.error('Error fetching coach week sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
};

/**
 * GET /sessions/:id
 * Returns a single session with its full roster (enrolled clients).
 * Admins/owners see any session; coaches see only their own.
 */
export const getSessionById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = IdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid session ID' });
      return;
    }

    const gymId = req.user?.gymId;
    if (!gymId) {
      res.status(400).json({ success: false, error: 'You must be assigned to a gym' });
      return;
    }

    const session = await ClassSession.findById(paramValidation.data.id);
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    if (session.gymId !== gymId && req.user?.userType !== UserType.ADMIN) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    if (req.user?.userType === UserType.COACH && session.coachId !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const enrollments = await Enrollment.find({ sessionId: session.id, status: 'enrolled' });
    const clientIds = enrollments.map(e => e.clientId);
    const clients = await User.find({ _id: { $in: clientIds } }).select('_id firstName lastName');
    const clientMap = new Map(clients.map(c => [c.id, { id: c.id, firstName: c.firstName, lastName: c.lastName }]));

    const enrolledCount = enrollments.length;

    const data = {
      ...session.toJSON(),
      enrolledCount,
      roster: enrollments.map(e => ({
        enrollmentId: e.id,
        clientId: e.clientId,
        source: e.source,
        status: e.status,
        client: clientMap.get(e.clientId),
      })),
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
};

/**
 * DELETE /sessions?weekStart=YYYY-MM-DD
 * Delete all sessions for a given week. Admin/owner only.
 */
export const deleteSessionsForWeek = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const gymId = req.user?.gymId;
    if (!gymId) {
      res.status(400).json({ success: false, error: 'You must be assigned to a gym' });
      return;
    }

    const { weekStart: weekStartParam } = req.query as { weekStart?: string };
    if (!weekStartParam) {
      res.status(400).json({ success: false, error: 'weekStart query parameter is required' });
      return;
    }

    const weekStart = new Date(weekStartParam);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const sessions = await ClassSession.find({
      gymId,
      date: { $gte: weekStart, $lt: weekEnd },
    }).select('_id');

    const sessionIds = sessions.map(s => s.id);
    await ClassSession.deleteMany({ _id: { $in: sessionIds } });
    await Enrollment.deleteMany({ sessionId: { $in: sessionIds } });

    res.json({ success: true, data: { deleted: sessionIds.length } });
  } catch (error) {
    console.error('Error deleting sessions for week:', error);
    res.status(500).json({ success: false, error: 'Failed to delete sessions' });
  }
};

/**
 * DELETE /sessions/:id
 * Delete a class session. Admin/owner only.
 */
export const deleteSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = IdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid session ID' });
      return;
    }

    const gymId = req.user?.gymId;
    const session = await ClassSession.findById(paramValidation.data.id);
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    if (req.user?.userType !== UserType.ADMIN && session.gymId !== gymId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    await ClassSession.findByIdAndDelete(paramValidation.data.id);
    await Enrollment.deleteMany({ sessionId: paramValidation.data.id });

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, error: 'Failed to delete session' });
  }
};
