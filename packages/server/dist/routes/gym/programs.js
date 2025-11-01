"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const programs_1 = require("../../controllers/programs");
const programProgress_1 = __importDefault(require("./programProgress"));
const router = express_1.default.Router();
// GET /api/gym/programs - List all programs (with pagination and filtering)
// Owner/Admin access with gym scoping
router.get('/', auth_1.verifyToken, programs_1.getAllPrograms);
// GET /api/gym/programs/:id - Get program by ID
// Owner/Admin access with gym scoping
router.get('/:id', auth_1.verifyToken, programs_1.getProgramById);
// POST /api/gym/programs - Create new program
// Owner/Admin access with gym scoping
router.post('/', auth_1.verifyToken, auth_1.requireOwnerOrAdminForGym, programs_1.createProgram);
// PUT /api/gym/programs/:id - Update program
// Owner/Admin access with gym scoping
router.put('/:id', auth_1.verifyToken, programs_1.updateProgram);
// DELETE /api/gym/programs/:id - Delete program (soft delete)
// Owner/Admin access with gym scoping
router.delete('/:id', auth_1.verifyToken, programs_1.deleteProgram);
// Progress tracking routes - /api/gym/programs/:id/progress/*
router.use('/:id/progress', programProgress_1.default);
exports.default = router;
//# sourceMappingURL=programs.js.map