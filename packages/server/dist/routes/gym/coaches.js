import express from 'express';
import { verifyToken, requireOwnerOrAdminForGym, } from '../../middleware/auth.js';
import { getAllCoaches, getCoachById, createCoach, updateCoach, deleteCoach, resetCoachPassword, } from '../../controllers/coaches.js';
const router = express.Router();
// List all coaches (with pagination and filtering)
router.get('/', verifyToken, getAllCoaches);
// Get a single coach by ID
router.get('/:id', verifyToken, getCoachById);
// Create a new coach (requires owner or admin permissions)
router.post('/', verifyToken, requireOwnerOrAdminForGym, createCoach);
// Update a coach
router.put('/:id', verifyToken, updateCoach);
// Delete a coach
router.delete('/:id', verifyToken, deleteCoach);
// Reset coach password
router.post('/:id/reset-password', verifyToken, resetCoachPassword);
export default router;
//# sourceMappingURL=coaches.js.map