import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * GET /api/me/workouts/current-week
 * Get current week's workout plan with pre-calculated weights
 */
export declare const getCurrentWeekWorkouts: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=workouts.d.ts.map