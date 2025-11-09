import express from 'express';
import {
  verifyToken,
  requireGymStaffAccess,
  AuthenticatedRequest,
} from '../../middleware/auth.js';
import {
  getAllActivityTemplates,
  getActivityTemplateById,
  createActivityTemplate,
  updateActivityTemplate,
  deleteActivityTemplate,
} from '../../controllers/activityTemplates.js';

const router = express.Router();

// GET /api/gym/activity-templates - List all activity templates (with pagination and filtering)
// Owner/Admin access with gym scoping
router.get('/', verifyToken, getAllActivityTemplates);

// GET /api/gym/activity-templates/:id - Get activity template by ID
// Owner/Admin access with gym scoping
router.get('/:id', verifyToken, getActivityTemplateById);

// POST /api/gym/activity-templates - Create new activity template
// Gym staff access with gym scoping
router.post('/', verifyToken, requireGymStaffAccess, createActivityTemplate);

// PUT /api/gym/activity-templates/:id - Update activity template
// Owner/Admin access with gym scoping
router.put('/:id', verifyToken, updateActivityTemplate);

// DELETE /api/gym/activity-templates/:id - Delete activity template
// Owner/Admin access with gym scoping
router.delete('/:id', verifyToken, deleteActivityTemplate);

export default router;