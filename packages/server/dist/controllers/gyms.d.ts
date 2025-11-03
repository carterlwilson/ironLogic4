import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
/**
 * Get all gyms with pagination
 */
export declare const getAllGyms: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get gym by ID
 */
export declare const getGymById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create new gym (admin only)
 */
export declare const createGym: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update gym (admin only)
 */
export declare const updateGym: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete gym (admin only)
 */
export declare const deleteGym: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=gyms.d.ts.map