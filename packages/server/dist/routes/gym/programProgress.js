"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const programProgress_1 = require("../../controllers/programProgress");
const router = express_1.default.Router({ mergeParams: true });
// GET /api/gym/programs/:id/progress - Get current progress with metadata
// Owner/Admin access with gym scoping
router.get('/', auth_1.verifyToken, programProgress_1.getCurrentProgress);
// POST /api/gym/programs/:id/progress/start - Initialize progress tracking
// Owner/Admin access with gym scoping
router.post('/start', auth_1.verifyToken, programProgress_1.startProgram);
// POST /api/gym/programs/:id/progress/advance - Move to next week
// Owner/Admin access with gym scoping
router.post('/advance', auth_1.verifyToken, programProgress_1.advanceWeek);
// POST /api/gym/programs/:id/progress/previous - Go back one week
// Owner/Admin access with gym scoping
router.post('/previous', auth_1.verifyToken, programProgress_1.previousWeek);
// POST /api/gym/programs/:id/progress/jump - Jump to specific block/week
// Owner/Admin access with gym scoping
router.post('/jump', auth_1.verifyToken, programProgress_1.jumpToWeek);
// POST /api/gym/programs/:id/progress/reset - Reset progress to beginning
// Owner/Admin access with gym scoping
router.post('/reset', auth_1.verifyToken, programProgress_1.resetProgress);
exports.default = router;
//# sourceMappingURL=programProgress.js.map