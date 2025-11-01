"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const activityTemplates_1 = require("../../controllers/activityTemplates");
const router = express_1.default.Router();
// GET /api/gym/activity-templates - List all activity templates (with pagination and filtering)
// Owner/Admin access with gym scoping
router.get('/', auth_1.verifyToken, activityTemplates_1.getAllActivityTemplates);
// GET /api/gym/activity-templates/:id - Get activity template by ID
// Owner/Admin access with gym scoping
router.get('/:id', auth_1.verifyToken, activityTemplates_1.getActivityTemplateById);
// POST /api/gym/activity-templates - Create new activity template
// Owner/Admin access with gym scoping
router.post('/', auth_1.verifyToken, auth_1.requireOwnerOrAdminForGym, activityTemplates_1.createActivityTemplate);
// PUT /api/gym/activity-templates/:id - Update activity template
// Owner/Admin access with gym scoping
router.put('/:id', auth_1.verifyToken, activityTemplates_1.updateActivityTemplate);
// DELETE /api/gym/activity-templates/:id - Delete activity template
// Owner/Admin access with gym scoping
router.delete('/:id', auth_1.verifyToken, activityTemplates_1.deleteActivityTemplate);
exports.default = router;
//# sourceMappingURL=activityTemplates.js.map