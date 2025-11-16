import express from 'express';
import { verifyToken, requireGymStaffAccess } from '../../middleware/auth.js';
import {
  getAllBenchmarkTemplates,
  getAllBenchmarkTemplatesNoPagination,
  getBenchmarkTemplateById,
  createBenchmarkTemplate,
  updateBenchmarkTemplate,
  deleteBenchmarkTemplate,
} from '../../controllers/benchmarkTemplates.js';

const router = express.Router();

// GET /api/gym/benchmark-templates
// List all templates (with pagination, search, filtering)
// Auth: Required (verifyToken)
// Access: OWNER (own gym only), ADMIN (all gyms)
router.get('/', verifyToken, getAllBenchmarkTemplates);

// GET /api/gym/benchmark-templates/all
// Get ALL templates without pagination (for dropdowns)
// Auth: Required (verifyToken)
// Access: OWNER (own gym only), ADMIN (all gyms)
// IMPORTANT: Must come BEFORE /:id route so '/all' isn't treated as an ID
router.get('/all', verifyToken, getAllBenchmarkTemplatesNoPagination);

// GET /api/gym/benchmark-templates/:id
// Get single template by ID
// Auth: Required (verifyToken)
// Access: OWNER (own gym only), ADMIN (all gyms)
router.get('/:id', verifyToken, getBenchmarkTemplateById);

// POST /api/gym/benchmark-templates
// Create new template
// Auth: Required (verifyToken)
// Access: Gym staff only (requireGymStaffAccess)
router.post('/', verifyToken, requireGymStaffAccess, createBenchmarkTemplate);

// PUT /api/gym/benchmark-templates/:id
// Update template
// Auth: Required (verifyToken)
// Access: Gym staff only (requireGymStaffAccess)
router.put('/:id', verifyToken, requireGymStaffAccess, updateBenchmarkTemplate);

// DELETE /api/gym/benchmark-templates/:id
// Delete template
// Auth: Required (verifyToken)
// Access: Gym staff only (requireGymStaffAccess)
router.delete('/:id', verifyToken, requireGymStaffAccess, deleteBenchmarkTemplate);

export default router;