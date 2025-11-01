"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gyms_1 = require("../../controllers/gyms");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication and admin requirement to all routes
router.use(auth_1.verifyToken, auth_1.requireAdmin);
// GET /api/admin/gyms - Get all gyms with pagination and filtering
router.get('/', gyms_1.getAllGyms);
// GET /api/admin/gyms/:id - Get specific gym by ID
router.get('/:id', gyms_1.getGymById);
// POST /api/admin/gyms - Create new gym
router.post('/', gyms_1.createGym);
// PUT /api/admin/gyms/:id - Update gym
router.put('/:id', gyms_1.updateGym);
// DELETE /api/admin/gyms/:id - Delete gym
router.delete('/:id', gyms_1.deleteGym);
exports.default = router;
//# sourceMappingURL=gyms.js.map