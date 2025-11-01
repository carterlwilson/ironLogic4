"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const activityGroups_1 = require("../../controllers/activityGroups");
const router = express_1.default.Router();
router.get('/', auth_1.verifyToken, activityGroups_1.getAllActivityGroups);
router.get('/:id', auth_1.verifyToken, activityGroups_1.getActivityGroupById);
router.post('/', auth_1.verifyToken, auth_1.requireOwnerOrAdminForGym, activityGroups_1.createActivityGroup);
router.put('/:id', auth_1.verifyToken, activityGroups_1.updateActivityGroup);
router.delete('/:id', auth_1.verifyToken, activityGroups_1.deleteActivityGroup);
exports.default = router;
//# sourceMappingURL=activityGroups.js.map