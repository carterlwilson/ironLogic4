"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const requireClient_1 = require("../../middleware/requireClient");
const clientBenchmarks_1 = require("../../controllers/clientBenchmarks");
const benchmarkProgress_1 = require("../../controllers/benchmarkProgress");
const router = express_1.default.Router();
// All routes require authentication and CLIENT role
router.use(auth_1.verifyToken);
router.use(requireClient_1.requireClient);
/**
 * GET /api/me/benchmarks
 * Get authenticated client's benchmarks
 */
router.get('/', clientBenchmarks_1.getMyBenchmarks);
/**
 * POST /api/me/benchmarks
 * Create new benchmark from template
 */
router.post('/', clientBenchmarks_1.createMyBenchmark);
/**
 * GET /api/me/benchmarks/:templateId/progress
 * Get benchmark progress chart data for a specific template
 */
router.get('/:templateId/progress', benchmarkProgress_1.getBenchmarkProgress);
/**
 * PUT /api/me/benchmarks/:benchmarkId
 * Update existing benchmark
 */
router.put('/:benchmarkId', clientBenchmarks_1.updateMyBenchmark);
exports.default = router;
//# sourceMappingURL=benchmarks.js.map