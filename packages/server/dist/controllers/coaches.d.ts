import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Get all coaches with pagination, search, and gym scoping
 */
export declare const getAllCoaches: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get a single coach by ID
 */
export declare const getCoachById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create a new coach
 */
export declare const createCoach: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update a coach
 */
export declare const updateCoach: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete a coach (hard delete with dependency checks)
 */
export declare const deleteCoach: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Reset a coach's password
 */
export declare const resetCoachPassword: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=coaches.d.ts.map