import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Start Program - Initialize progress tracking
 * Sets startedAt timestamp and ensures progress is at block 0, week 0
 */
export declare const startProgram: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Advance Week - Move to next week with block advancement logic
 */
export declare const advanceWeek: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Previous Week - Go back one week
 */
export declare const previousWeek: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Jump to Week - Jump to a specific block and week
 */
export declare const jumpToWeek: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Reset Progress - Reset program to beginning
 */
export declare const resetProgress: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get Current Progress - Get progress with metadata
 */
export declare const getCurrentProgress: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=programProgress.d.ts.map