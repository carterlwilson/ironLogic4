"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const users_1 = require("../../controllers/users");
const router = express_1.default.Router();
// GET /api/users - List all users (with pagination)
// Admin only access
router.get('/', auth_1.verifyToken, auth_1.requireAdmin, users_1.getAllUsers);
// GET /api/users/:id - Get user by ID
// Admin only access
router.get('/:id', auth_1.verifyToken, auth_1.requireAdmin, users_1.getUserById);
// POST /api/users - Create new user (admin only)
router.post('/', auth_1.verifyToken, auth_1.requireAdmin, users_1.createUser);
// PUT /api/users/:id - Update user (admin only)
router.put('/:id', auth_1.verifyToken, auth_1.requireAdmin, users_1.updateUser);
// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', auth_1.verifyToken, auth_1.requireAdmin, users_1.deleteUser);
// POST /api/users/:id/reset-password - Reset user password (admin only)
router.post('/:id/reset-password', auth_1.verifyToken, auth_1.requireAdmin, users_1.resetUserPassword);
exports.default = router;
//# sourceMappingURL=users.js.map