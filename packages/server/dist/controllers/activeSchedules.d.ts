import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
/**
 * Get all active schedules with filtering
 */
export declare const getActiveSchedules: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get active schedule by ID
 */
export declare const getActiveScheduleById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create active schedule from template (lazy create)
 */
export declare const createActiveSchedule: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete active schedule
 */
export declare const deleteActiveSchedule: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Reset active schedule from template
 */
export declare const resetActiveSchedule: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Assign staff (coach) to active schedule
 */
export declare const assignStaff: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Unassign staff (coach) from active schedule
 */
export declare const unassignStaff: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=activeSchedules.d.ts.map