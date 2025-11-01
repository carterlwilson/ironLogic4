"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const benchmarks_1 = __importDefault(require("./benchmarks"));
const workouts_1 = __importDefault(require("./workouts"));
const router = express_1.default.Router();
// Mount sub-routers
router.use('/benchmarks', benchmarks_1.default);
router.use('/workouts', workouts_1.default);
// Future self-service endpoints can be added here:
// router.use('/profile', profileRouter);
exports.default = router;
//# sourceMappingURL=index.js.map