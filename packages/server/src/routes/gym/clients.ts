import express from 'express';
import {
  verifyToken,
  requireOwnerOrAdminForGym,
} from '../../middleware/auth';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  assignProgram,
  unassignProgram,
} from '../../controllers/clients';

const router = express.Router();

// List all clients (with pagination and filtering)
router.get('/', verifyToken, getAllClients);

// Get a single client by ID
router.get('/:id', verifyToken, getClientById);

// Create a new client (requires owner or admin permissions)
router.post('/', verifyToken, requireOwnerOrAdminForGym, createClient);

// Update a client
router.put('/:id', verifyToken, updateClient);

// Delete a client
router.delete('/:id', verifyToken, deleteClient);

// Assign a program to a client
router.patch('/:id/program', verifyToken, assignProgram);

// Unassign a program from a client
router.delete('/:id/program', verifyToken, unassignProgram);

export default router;