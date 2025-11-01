import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Get available schedules for client self-scheduling
 * Returns all active schedules for the user's gym with availability info
 */
export declare const getAvailableSchedules: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get authenticated client's current schedule (timeslots they're assigned to)
 */
export declare const getMySchedule: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Join a timeslot (client self-service)
 * Uses atomic update to prevent race conditions
 */
export declare const joinTimeslot: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Leave a timeslot (client self-service)
 */
export declare const leaveTimeslot: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=clientSchedules.d.ts.map