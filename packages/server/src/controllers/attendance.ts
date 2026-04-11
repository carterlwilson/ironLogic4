import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ClassSession } from '../models/ClassSession.js';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { ApiResponse, SubmitAttendanceSchema, UserType } from '@ironlogic4/shared';
import { z } from 'zod';

const SessionParamSchema = z.object({
  sessionId: z.string().min(1),
});

/**
 * POST /sessions/:sessionId/attendance
 * Coach submits attendance for all clients in a session.
 */
export const submitAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = SessionParamSchema.safeParse(req.params);
    const bodyValidation = SubmitAttendanceSchema.safeParse(req.body);

    if (!paramValidation.success || !bodyValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: bodyValidation.error?.errors,
      });
      return;
    }

    const { sessionId } = paramValidation.data;
    const { attendance } = bodyValidation.data;
    const recordedBy = req.user?.id;
    const gymId = req.user?.gymId;

    if (!recordedBy) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const session = await ClassSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    // Coaches can only submit attendance for their own sessions
    if (req.user?.userType === UserType.COACH && session.coachId !== recordedBy) {
      res.status(403).json({ success: false, error: 'You can only record attendance for your own sessions' });
      return;
    }

    // Owners can only access their gym's sessions
    if (req.user?.userType === UserType.OWNER && session.gymId !== gymId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const now = new Date();
    const results = await Promise.all(
      attendance.map(({ clientId, status }) =>
        Attendance.findOneAndUpdate(
          { sessionId, clientId },
          { sessionId, clientId, status, recordedBy, recordedAt: now },
          { upsert: true, new: true }
        )
      )
    );

    const response: ApiResponse<any> = {
      success: true,
      data: results.map(r => r!.toJSON()),
      message: `Attendance recorded for ${results.length} client(s)`,
    };
    res.json(response);
  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to submit attendance' });
  }
};

/**
 * GET /sessions/:sessionId/attendance
 * Returns attendance records for a session, with client names.
 */
export const getAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = SessionParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid session ID' });
      return;
    }

    const { sessionId } = paramValidation.data;
    const gymId = req.user?.gymId;

    const session = await ClassSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    if (req.user?.userType !== UserType.ADMIN && session.gymId !== gymId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const records = await Attendance.find({ sessionId });
    const clientIds = records.map(r => r.clientId);
    const clients = await User.find({ _id: { $in: clientIds } }).select('_id firstName lastName');
    const clientMap = new Map(clients.map(c => [c.id, { id: c.id, firstName: c.firstName, lastName: c.lastName }]));

    const data = records.map(r => ({
      ...r.toJSON(),
      client: clientMap.get(r.clientId),
    }));

    const response: ApiResponse<typeof data> = { success: true, data };
    res.json(response);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
};
