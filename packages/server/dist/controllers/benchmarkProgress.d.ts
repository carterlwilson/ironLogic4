import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
/**
 * GET /api/me/benchmarks/:templateId/progress
 * Get benchmark progress data for charts
 *
 * Query Parameters:
 * - limit: Maximum number of data points to return (optional)
 * - startDate: ISO date string for filtering (optional)
 * - endDate: ISO date string for filtering (optional)
 */
export declare const getBenchmarkProgress: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=benchmarkProgress.d.ts.map