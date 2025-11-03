import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
/**
 * Get all schedule templates with filtering
 */
export declare const getScheduleTemplates: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get schedule template by ID
 */
export declare const getScheduleTemplateById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create new schedule template
 */
export declare const createScheduleTemplate: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update schedule template by ID
 */
export declare const updateScheduleTemplate: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete schedule template by ID
 */
export declare const deleteScheduleTemplate: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=scheduleTemplates.d.ts.map