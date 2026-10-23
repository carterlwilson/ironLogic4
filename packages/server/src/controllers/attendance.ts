import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ActiveSchedule } from '../models/ActiveSchedule.js';
import { AttendanceRecord, AttendanceRecordDocument } from '../models/AttendanceRecord.js';
import { User } from '../models/User.js';
import {
  ApiResponse,
  AttendanceGroupBy,
  AttendanceStatus,
  IAttendanceRecord,
  IAttendanceSummaryResponse,
  IClientAttendanceHistory,
  IClientAttendanceSummary,
  SubmitClassAttendanceSchema,
  ClassAttendanceQuerySchema,
  AttendanceRangeQuerySchema,
  UserType,
  getAttendancePeriodStart,
  listAttendancePeriods,
  parseDateString,
  toDateString,
} from '@ironlogic4/shared';
import { z } from 'zod';

const ClientIdParamSchema = z.object({
  clientId: z.string().min(1),
});

/**
 * Owners and coaches are always scoped to their own gym; admins pass gymId.
 * Returns null with a response already sent on failure.
 */
function resolveGymId(req: AuthenticatedRequest, res: Response, requestedGymId?: string): string | null {
  if (req.user?.userType === UserType.ADMIN) {
    if (!requestedGymId) {
      res.status(400).json({ success: false, error: 'Gym ID is required' });
      return null;
    }
    return requestedGymId;
  }

  if (!req.user?.gymId) {
    res.status(400).json({ success: false, error: 'You must be assigned to a gym to view attendance' });
    return null;
  }
  return req.user.gymId;
}

/**
 * Find the active schedule timeslot for a class, scoped to what the requesting
 * user may manage. Returns null with a response already sent on failure.
 */
async function findClassTimeslot(timeslotId: string, req: AuthenticatedRequest, res: Response) {
  if (!mongoose.isValidObjectId(timeslotId)) {
    res.status(404).json({ success: false, error: 'Timeslot not found' });
    return null;
  }

  const schedule = await ActiveSchedule.findOne({ 'days.timeSlots._id': timeslotId });

  if (!schedule || (req.user?.userType !== UserType.ADMIN && schedule.gymId.toString() !== req.user?.gymId)) {
    res.status(404).json({ success: false, error: 'Timeslot not found' });
    return null;
  }

  for (const day of schedule.days) {
    const slot = day.timeSlots.find(s => s.id === timeslotId);
    if (slot) {
      if (req.user?.userType === UserType.COACH && !slot.coachIds.includes(req.user.id)) {
        res.status(403).json({
          success: false,
          error: 'You can only take attendance for classes you coach.',
        });
        return null;
      }
      return { gymId: schedule.gymId.toString(), dayOfWeek: day.dayOfWeek, slot };
    }
  }

  res.status(404).json({ success: false, error: 'Timeslot not found' });
  return null;
}

/**
 * Count present/absent per period for a set of records
 */
function summarize(
  records: AttendanceRecordDocument[],
  periods: string[],
  groupBy: AttendanceGroupBy
): Omit<IClientAttendanceSummary, 'clientId' | 'firstName' | 'lastName'> {
  const byPeriod = new Map(periods.map(p => [p, { periodStart: p, present: 0, absent: 0 }]));
  let present = 0;
  let absent = 0;

  for (const record of records) {
    const bucket = byPeriod.get(getAttendancePeriodStart(record.date, groupBy));
    if (record.status === AttendanceStatus.PRESENT) {
      present++;
      if (bucket) bucket.present++;
    } else {
      absent++;
      if (bucket) bucket.absent++;
    }
  }

  return { present, absent, byPeriod: Array.from(byPeriod.values()) };
}

/**
 * Get recorded attendance for one class on one date (prefills the coach roster)
 */
export const getClassAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = ClassAttendanceQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors,
      });
      return;
    }

    const { timeslotId, date } = validation.data;
    const found = await findClassTimeslot(timeslotId, req, res);
    if (!found) return;

    const records = await AttendanceRecord.find({ timeslotId, date });

    const response: ApiResponse<any> = {
      success: true,
      data: records.map(r => r.toJSON()),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch class attendance',
    });
  }
};

/**
 * Record attendance for a whole class roster on one date. The submitted
 * entries replace whatever was recorded for that class and date before.
 */
export const submitClassAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = SubmitClassAttendanceSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid attendance data',
        details: validation.error.errors,
      });
      return;
    }

    const { timeslotId, date, entries } = validation.data;

    // Allow one day of slack for the client's local date running ahead of the server's
    const now = new Date();
    const latestAllowed = toDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    if (date > latestAllowed) {
      res.status(400).json({ success: false, error: 'Cannot record attendance for a future date' });
      return;
    }

    const found = await findClassTimeslot(timeslotId, req, res);
    if (!found) return;
    const { gymId, dayOfWeek, slot } = found;

    if (parseDateString(date).getDay() !== dayOfWeek) {
      res.status(400).json({ success: false, error: 'Date does not fall on this class\'s day of the week' });
      return;
    }

    const clientIds = entries.map(e => e.clientId);
    const allIdsValid = clientIds.every(id => mongoose.isValidObjectId(id));
    const validClientCount = allIdsValid
      ? await User.countDocuments({ _id: { $in: clientIds }, gymId, userType: UserType.CLIENT })
      : 0;
    if (validClientCount !== clientIds.length) {
      res.status(400).json({ success: false, error: 'All clients must be clients of this gym' });
      return;
    }

    await AttendanceRecord.bulkWrite(entries.map(entry => ({
      updateOne: {
        filter: { timeslotId, date, clientId: entry.clientId },
        update: {
          $set: {
            gymId,
            dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            location: slot.location,
            coachIds: slot.coachIds,
            status: entry.status,
            walkIn: !slot.assignedClients.includes(entry.clientId),
            recordedBy: req.user!.id,
          },
        },
        upsert: true,
      },
    })));

    // Clients dropped from the roster since the last submission (e.g. a mistaken walk-in)
    await AttendanceRecord.deleteMany({ timeslotId, date, clientId: { $nin: clientIds } });

    const records = await AttendanceRecord.find({ timeslotId, date });

    const response: ApiResponse<any> = {
      success: true,
      data: records.map(r => r.toJSON()),
      message: 'Attendance recorded successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error submitting class attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit attendance',
    });
  }
};

/**
 * Per-client attendance counts for every client in the gym over a date range
 */
export const getAttendanceSummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = AttendanceRangeQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors,
      });
      return;
    }

    const { from, to, groupBy } = validation.data;
    const gymId = resolveGymId(req, res, validation.data.gymId);
    if (!gymId) return;

    const [clients, records] = await Promise.all([
      User.find({ gymId, userType: UserType.CLIENT }).select('firstName lastName').sort({ lastName: 1, firstName: 1 }),
      AttendanceRecord.find({ gymId, date: { $gte: from, $lte: to } }),
    ]);

    const recordsByClient = new Map<string, AttendanceRecordDocument[]>();
    for (const record of records) {
      const list = recordsByClient.get(record.clientId) ?? [];
      list.push(record);
      recordsByClient.set(record.clientId, list);
    }

    const periods = listAttendancePeriods(from, to, groupBy);

    const response: ApiResponse<IAttendanceSummaryResponse> = {
      success: true,
      data: {
        from,
        to,
        groupBy,
        periods,
        clients: clients.map(client => ({
          clientId: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          ...summarize(recordsByClient.get(client.id) ?? [], periods, groupBy),
        })),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance summary',
    });
  }
};

/**
 * One client's attendance records and per-period counts over a date range
 */
export const getClientAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = ClientIdParamSchema.safeParse(req.params);
    const queryValidation = AttendanceRangeQuerySchema.safeParse(req.query);

    if (!paramValidation.success || !queryValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: [
          ...(paramValidation.success ? [] : paramValidation.error.errors),
          ...(queryValidation.success ? [] : queryValidation.error.errors),
        ],
      });
      return;
    }

    const { clientId } = paramValidation.data;
    const { from, to, groupBy } = queryValidation.data;

    const client = mongoose.isValidObjectId(clientId)
      ? await User.findById(clientId).select('firstName lastName gymId userType')
      : null;
    if (
      !client ||
      client.userType !== UserType.CLIENT ||
      (req.user?.userType !== UserType.ADMIN && client.gymId !== req.user?.gymId)
    ) {
      res.status(404).json({ success: false, error: 'Client not found' });
      return;
    }

    const records = await AttendanceRecord.find({ clientId, date: { $gte: from, $lte: to } })
      .sort({ date: -1, startTime: -1 });

    const periods = listAttendancePeriods(from, to, groupBy);

    const response: ApiResponse<IClientAttendanceHistory> = {
      success: true,
      data: {
        from,
        to,
        groupBy,
        periods,
        summary: {
          clientId: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          ...summarize(records, periods, groupBy),
        },
        records: records.map(r => r.toJSON() as unknown as IAttendanceRecord),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching client attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client attendance',
    });
  }
};
