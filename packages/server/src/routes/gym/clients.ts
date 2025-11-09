import express from 'express';
import {
  verifyToken,
  requireGymStaffAccess,
} from '../../middleware/auth.js';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  assignProgram,
  unassignProgram,
} from '../../controllers/clients.js';

const router = express.Router();

// List all clients (with pagination and filtering)
router.get('/', verifyToken, getAllClients);

// Get a single client by ID
router.get('/:id', verifyToken, getClientById);

// Create a new client (requires gym staff permissions)
router.post('/', verifyToken, requireGymStaffAccess, createClient);

// Update a client
router.put('/:id', verifyToken, updateClient);

// Delete a client
router.delete('/:id', verifyToken, deleteClient);

// Assign a program to a client
router.patch('/:id/program', verifyToken, assignProgram);

// Unassign a program from a client
router.delete('/:id/program', verifyToken, unassignProgram);

export default router;