import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Get all activity templates with pagination and filtering
 */
export declare const getAllActivityTemplates: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get activity template by ID
 */
export declare const getActivityTemplateById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create new activity template
 */
export declare const createActivityTemplate: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update activity template by ID
 */
export declare const updateActivityTemplate: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete activity template by ID
 */
export declare const deleteActivityTemplate: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=activityTemplates.d.ts.map