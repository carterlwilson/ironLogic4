"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const benchmarkTemplates_1 = require("../../controllers/benchmarkTemplates");
const router = express_1.default.Router();
// GET /api/gym/benchmark-templates
// List all templates (with pagination, search, filtering)
// Auth: Required (verifyToken)
// Access: OWNER (own gym only), ADMIN (all gyms)
router.get('/', auth_1.verifyToken, benchmarkTemplates_1.getAllBenchmarkTemplates);
// GET /api/gym/benchmark-templates/:id
// Get single template by ID
// Auth: Required (verifyToken)
// Access: OWNER (own gym only), ADMIN (all gyms)
router.get('/:id', auth_1.verifyToken, benchmarkTemplates_1.getBenchmarkTemplateById);
// POST /api/gym/benchmark-templates
// Create new template
// Auth: Required (verifyToken)
// Access: OWNER or ADMIN only (requireOwnerOrAdminForGym)
router.post('/', auth_1.verifyToken, auth_1.requireOwnerOrAdminForGym, benchmarkTemplates_1.createBenchmarkTemplate);
// PUT /api/gym/benchmark-templates/:id
// Update template
// Auth: Required (verifyToken)
// Access: OWNER or ADMIN only (requireOwnerOrAdminForGym)
router.put('/:id', auth_1.verifyToken, auth_1.requireOwnerOrAdminForGym, benchmarkTemplates_1.updateBenchmarkTemplate);
// DELETE /api/gym/benchmark-templates/:id
// Delete template
// Auth: Required (verifyToken)
// Access: OWNER or ADMIN only (requireOwnerOrAdminForGym)
router.delete('/:id', auth_1.verifyToken, auth_1.requireOwnerOrAdminForGym, benchmarkTemplates_1.deleteBenchmarkTemplate);
exports.default = router;
//# sourceMappingURL=benchmarkTemplates.js.map