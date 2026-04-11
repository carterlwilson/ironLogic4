import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ClassSession } from '../models/ClassSession.js';
import { Enrollment } from '../models/Enrollment.js';
import { ApiResponse, UserType } from '@ironlogic4/shared';
import { z } from 'zod';

const SessionParamSchema = z.object({
  sessionId: z.string().min(1),
});

const AdminEnrollSchema = z.object({
  clientId: z.string().min(1),
});

const AdminUnenrollSchema = z.object({
  clientId: z.string().min(1),
});

/**
 * POST /sessions/:sessionId/enroll
 * Enroll the authenticated client in a session.
 */
export const enrollInSession = async (
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
    const clientId = req.user?.id;
    const gymId = req.user?.gymId;

    if (!clientId || !gymId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const session = await ClassSession.findById(sessionId);
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    if (session.gymId !== gymId) {
      res.status(403).json({ success: false, error: 'You can only enroll in sessions at your gym' });
      return;
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ sessionId, clientId });
    if (existing) {
      if (existing.status === 'enrolled') {
        res.status(400).json({ success: false, error: 'You are already enrolled in this session' });
        return;
      }
      // Was skipped — re-enroll
      existing.status = 'enrolled';
      existing.source = 'override';
      await existing.save();
      const response: ApiResponse<any> = { success: true, data: existing.toJSON(), message: 'Successfully enrolled' };
      res.json(response);
      return;
    }

    // Check capacity
    const enrolledCount = await Enrollment.countDocuments({ sessionId, status: 'enrolled' });
    if (enrolledCount >= session.maxCapacity) {
      res.status(400).json({ success: false, error: 'This session is at full capacity' });
      return;
    }

    // Check client is not already enrolled in another session on the same day
    const sessionDateStart = new Date(session.date);
    sessionDateStart.setUTCHours(0, 0, 0, 0);
    const sessionDateEnd = new Date(sessionDateStart);
    sessionDateEnd.setUTCDate(sessionDateStart.getUTCDate() + 1);

    const sameDaySessions = await ClassSession.find({
      gymId,
      date: { $gte: sessionDateStart, $lt: sessionDateEnd },
    });
    const sameDaySessionIds = sameDaySessions.map(s => s.id).filter(id => id !== sessionId);

    if (sameDaySessionIds.length > 0) {
      const conflict = await Enrollment.findOne({
        sessionId: { $in: sameDaySessionIds },
        clientId,
        status: 'enrolled',
      });
      if (conflict) {
        res.status(400).json({ success: false, error: 'You are already enrolled in a session on this day' });
        return;
      }
    }

    const enrollment = await Enrollment.create({
      sessionId,
      clientId,
      source: 'override',
      status: 'enrolled',
      enrolledAt: new Date(),
    });

    const response: ApiResponse<any> = { success: true, data: enrollment.toJSON(), message: 'Successfully enrolled' };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error enrolling in session:', error);
    res.status(500).json({ success: false, error: 'Failed to enroll' });
  }
};

/**
 * DELETE /sessions/:sessionId/enroll
 * Unenroll the authenticated client from a session.
 * Default enrollments are marked skipped; override enrollments are deleted.
 */
export const unenrollFromSession = async (
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
    const clientId = req.user?.id;

    if (!clientId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const enrollment = await Enrollment.findOne({ sessionId, clientId });
    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Enrollment not found' });
      return;
    }

    if (enrollment.source === 'default') {
      enrollment.status = 'skipped';
      await enrollment.save();
    } else {
      await Enrollment.findByIdAndDelete(enrollment.id);
    }

    const response: ApiResponse<null> = { success: true, message: 'Successfully unenrolled' };
    res.json(response);
  } catch (error) {
    console.error('Error unenrolling from session:', error);
    res.status(500).json({ success: false, error: 'Failed to unenroll' });
  }
};

/**
 * POST /sessions/:sessionId/enroll/admin
 * Admin/owner manually enrolls a specific client, bypassing capacity.
 */
export const adminEnrollClient = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = SessionParamSchema.safeParse(req.params);
    const bodyValidation = AdminEnrollSchema.safeParse(req.body);

    if (!paramValidation.success || !bodyValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid request data' });
      return;
    }

    const { sessionId } = paramValidation.data;
    const { clientId } = bodyValidation.data;
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

    const existing = await Enrollment.findOne({ sessionId, clientId });
    if (existing) {
      if (existing.status === 'enrolled') {
        res.status(400).json({ success: false, error: 'Client is already enrolled in this session' });
        return;
      }
      existing.status = 'enrolled';
      existing.source = 'override';
      await existing.save();
      const response: ApiResponse<any> = { success: true, data: existing.toJSON(), message: 'Client enrolled' };
      res.json(response);
      return;
    }

    const enrollment = await Enrollment.create({
      sessionId,
      clientId,
      source: 'override',
      status: 'enrolled',
      enrolledAt: new Date(),
    });

    const response: ApiResponse<any> = { success: true, data: enrollment.toJSON(), message: 'Client enrolled' };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error admin enrolling client:', error);
    res.status(500).json({ success: false, error: 'Failed to enroll client' });
  }
};

/**
 * DELETE /sessions/:sessionId/enroll/admin
 * Admin/owner removes a specific client from a session.
 * Default enrollments are marked skipped; override enrollments are deleted.
 */
export const adminUnenrollClient = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = SessionParamSchema.safeParse(req.params);
    const bodyValidation = AdminUnenrollSchema.safeParse(req.body);

    if (!paramValidation.success || !bodyValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid request data' });
      return;
    }

    const { sessionId } = paramValidation.data;
    const { clientId } = bodyValidation.data;
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

    const enrollment = await Enrollment.findOne({ sessionId, clientId });
    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Enrollment not found' });
      return;
    }

    if (enrollment.source === 'default') {
      enrollment.status = 'skipped';
      await enrollment.save();
    } else {
      await Enrollment.findByIdAndDelete(enrollment.id);
    }

    const response: ApiResponse<null> = { success: true, message: 'Client unenrolled' };
    res.json(response);
  } catch (error) {
    console.error('Error admin unenrolling client:', error);
    res.status(500).json({ success: false, error: 'Failed to unenroll client' });
  }
};
