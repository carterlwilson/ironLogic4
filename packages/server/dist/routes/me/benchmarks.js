import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import { requireClient } from '../../middleware/requireClient.js';
import { getMyBenchmarks, createMyBenchmark, updateMyBenchmark, } from '../../controllers/clientBenchmarks.js';
import { getBenchmarkProgress } from '../../controllers/benchmarkProgress.js';
const router = express.Router();
// All routes require authentication and CLIENT role
router.use(verifyToken);
router.use(requireClient);
/**
 * GET /api/me/benchmarks
 * Get authenticated client's benchmarks
 */
router.get('/', getMyBenchmarks);
/**
 * POST /api/me/benchmarks
 * Create new benchmark from template
 */
router.post('/', createMyBenchmark);
/**
 * GET /api/me/benchmarks/:templateId/progress
 * Get benchmark progress chart data for a specific template
 */
router.get('/:templateId/progress', getBenchmarkProgress);
/**
 * PUT /api/me/benchmarks/:benchmarkId
 * Update existing benchmark
 */
router.put('/:benchmarkId', updateMyBenchmark);
export default router;
//# sourceMappingURL=benchmarks.js.map