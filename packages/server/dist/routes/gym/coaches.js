"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const coaches_1 = require("../../controllers/coaches");
const router = express_1.default.Router();
// List all coaches (with pagination and filtering)
router.get('/', auth_1.verifyToken, coaches_1.getAllCoaches);
// Get a single coach by ID
router.get('/:id', auth_1.verifyToken, coaches_1.getCoachById);
// Create a new coach (requires owner or admin permissions)
router.post('/', auth_1.verifyToken, auth_1.requireOwnerOrAdminForGym, coaches_1.createCoach);
// Update a coach
router.put('/:id', auth_1.verifyToken, coaches_1.updateCoach);
// Delete a coach
router.delete('/:id', auth_1.verifyToken, coaches_1.deleteCoach);
// Reset coach password
router.post('/:id/reset-password', auth_1.verifyToken, coaches_1.resetCoachPassword);
exports.default = router;
//# sourceMappingURL=coaches.js.map