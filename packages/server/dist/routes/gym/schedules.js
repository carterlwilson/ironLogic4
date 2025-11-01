"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const scheduleTemplates_1 = require("../../controllers/scheduleTemplates");
const activeSchedules_1 = require("../../controllers/activeSchedules");
const clientSchedules_1 = require("../../controllers/clientSchedules");
const shared_1 = require("@ironlogic4/shared");
const router = express_1.default.Router();
// ===== Schedule Template Routes =====
// GET /api/gym/schedules/templates - List all schedule templates
// Admin/Owner/Coach access (coaches see only schedules they're assigned to)
router.get('/templates', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER, shared_1.UserType.COACH]), scheduleTemplates_1.getScheduleTemplates);
// GET /api/gym/schedules/templates/:id - Get schedule template by ID
// Admin/Owner/Coach access (coaches can only view schedules they're assigned to)
router.get('/templates/:id', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER, shared_1.UserType.COACH]), scheduleTemplates_1.getScheduleTemplateById);
// POST /api/gym/schedules/templates - Create new schedule template
// Admin/Owner only
router.post('/templates', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER]), scheduleTemplates_1.createScheduleTemplate);
// PUT /api/gym/schedules/templates/:id - Update schedule template
// Admin/Owner only
router.put('/templates/:id', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER]), scheduleTemplates_1.updateScheduleTemplate);
// DELETE /api/gym/schedules/templates/:id - Delete schedule template
// Admin/Owner only
router.delete('/templates/:id', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER]), scheduleTemplates_1.deleteScheduleTemplate);
// ===== Active Schedule Routes =====
// GET /api/gym/schedules/active - List all active schedules
// Admin/Owner/Coach/Client access (clients see schedules for their gym only)
router.get('/active', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER, shared_1.UserType.COACH, shared_1.UserType.CLIENT]), activeSchedules_1.getActiveSchedules);
// GET /api/gym/schedules/active/:id - Get active schedule by ID
// Admin/Owner/Coach/Client access (clients can only view schedules from their gym)
router.get('/active/:id', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER, shared_1.UserType.COACH, shared_1.UserType.CLIENT]), activeSchedules_1.getActiveScheduleById);
// POST /api/gym/schedules/active - Create active schedule from template
// Admin/Owner only
router.post('/active', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER]), activeSchedules_1.createActiveSchedule);
// DELETE /api/gym/schedules/active/:id - Delete active schedule
// Admin/Owner only
router.delete('/active/:id', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER]), activeSchedules_1.deleteActiveSchedule);
// POST /api/gym/schedules/active/:id/reset - Reset active schedule from template
// Admin/Owner only
router.post('/active/:id/reset', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER]), activeSchedules_1.resetActiveSchedule);
// ===== Staff Assignment Routes =====
// POST /api/gym/schedules/active/:id/assign - Assign coach to active schedule
// Admin/Owner only
router.post('/active/:id/assign', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER]), activeSchedules_1.assignStaff);
// DELETE /api/gym/schedules/active/:id/unassign/:coachId - Unassign coach from active schedule
// Admin/Owner only
router.delete('/active/:id/unassign/:coachId', auth_1.verifyToken, (0, auth_1.requireRole)([shared_1.UserType.ADMIN, shared_1.UserType.OWNER]), activeSchedules_1.unassignStaff);
// ===== Client Self-Service Routes =====
// GET /api/gym/schedules/available - Get available schedules for client self-scheduling
// All authenticated users (clients see schedules for their gym only)
router.get('/available', auth_1.verifyToken, clientSchedules_1.getAvailableSchedules);
// GET /api/gym/schedules/my-schedule - Get authenticated client's schedule
// All authenticated users
router.get('/my-schedule', auth_1.verifyToken, clientSchedules_1.getMySchedule);
// POST /api/gym/schedules/active/:id/timeslots/:timeslotId/join - Join a timeslot
// All authenticated users (with gym validation)
router.post('/active/:id/timeslots/:timeslotId/join', auth_1.verifyToken, clientSchedules_1.joinTimeslot);
// DELETE /api/gym/schedules/active/:id/timeslots/:timeslotId/leave - Leave a timeslot
// All authenticated users (with gym validation)
router.delete('/active/:id/timeslots/:timeslotId/leave', auth_1.verifyToken, clientSchedules_1.leaveTimeslot);
exports.default = router;
//# sourceMappingURL=schedules.js.map