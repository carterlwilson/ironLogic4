import express from 'express';
import { verifyToken, requireOwnerOrAdminForGym } from '../../middleware/auth.js';
import {
  getAllBenchmarkTemplates,
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

// GET /api/gym/benchmark-templates/:id
// Get single template by ID
// Auth: Required (verifyToken)
// Access: OWNER (own gym only), ADMIN (all gyms)
router.get('/:id', verifyToken, getBenchmarkTemplateById);

// POST /api/gym/benchmark-templates
// Create new template
// Auth: Required (verifyToken)
// Access: OWNER or ADMIN only (requireOwnerOrAdminForGym)
router.post('/', verifyToken, requireOwnerOrAdminForGym, createBenchmarkTemplate);

// PUT /api/gym/benchmark-templates/:id
// Update template
// Auth: Required (verifyToken)
// Access: OWNER or ADMIN only (requireOwnerOrAdminForGym)
router.put('/:id', verifyToken, requireOwnerOrAdminForGym, updateBenchmarkTemplate);

// DELETE /api/gym/benchmark-templates/:id
// Delete template
// Auth: Required (verifyToken)
// Access: OWNER or ADMIN only (requireOwnerOrAdminForGym)
router.delete('/:id', verifyToken, requireOwnerOrAdminForGym, deleteBenchmarkTemplate);

export default router;