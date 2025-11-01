"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const requireClient_1 = require("../../middleware/requireClient");
const workouts_1 = require("../../controllers/workouts");
const router = express_1.default.Router();
// All routes require authentication and CLIENT role
router.use(auth_1.verifyToken);
router.use(requireClient_1.requireClient);
// GET /api/me/workouts/current-week
router.get('/current-week', workouts_1.getCurrentWeekWorkouts);
exports.default = router;
//# sourceMappingURL=workouts.js.map