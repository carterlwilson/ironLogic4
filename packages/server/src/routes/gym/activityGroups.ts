import express from 'express';
import {
  verifyToken,
  requireOwnerOrAdminForGym,
  AuthenticatedRequest,
} from '../../middleware/auth.js';
import {
  getAllActivityGroups,
  getActivityGroupById,
  createActivityGroup,
  updateActivityGroup,
  deleteActivityGroup,
} from '../../controllers/activityGroups.js';

const router = express.Router();

router.get('/', verifyToken, getAllActivityGroups);

router.get('/:id', verifyToken, getActivityGroupById);

router.post('/', verifyToken, requireOwnerOrAdminForGym, createActivityGroup);

router.put('/:id', verifyToken, updateActivityGroup);

router.delete('/:id', verifyToken, deleteActivityGroup);

export default router;