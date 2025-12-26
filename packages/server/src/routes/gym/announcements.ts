import express from 'express';
import {
  verifyToken,
  requireOwnerOrAdminForGym,
} from '../../middleware/auth.js';
import {
  getAnnouncement,
  upsertAnnouncement,
  deleteAnnouncement,
} from '../../controllers/announcements.js';

const router = express.Router();

// GET /api/gym/announcements - Get announcement for user's gym
router.get('/', verifyToken, getAnnouncement);

// PUT /api/gym/announcements - Upsert announcement (owner/admin only)
router.put('/', verifyToken, requireOwnerOrAdminForGym, upsertAnnouncement);

// DELETE /api/gym/announcements - Delete announcement (owner/admin only)
router.delete('/', verifyToken, requireOwnerOrAdminForGym, deleteAnnouncement);

export default router;
