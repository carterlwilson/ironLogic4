import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * GET /api/me/benchmarks
 * Get authenticated client's benchmarks
 */
export declare const getMyBenchmarks: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * POST /api/me/benchmarks
 * Create new benchmark from template
 * Optionally moves an old benchmark to historical if oldBenchmarkId is provided
 */
export declare const createMyBenchmark: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * PUT /api/me/benchmarks/:benchmarkId
 * Update existing benchmark
 */
export declare const updateMyBenchmark: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=clientBenchmarks.d.ts.map