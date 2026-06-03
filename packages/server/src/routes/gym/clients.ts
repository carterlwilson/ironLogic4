import express from 'express';
import {
  verifyToken,
  requireGymStaffAccess,
  requireRole,
} from '../../middleware/auth.js';
import { UserType } from '@ironlogic4/shared';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  assignProgram,
  unassignProgram,
  sendClientInvite,
} from '../../controllers/clients.js';

const router = express.Router();

// List all clients (with pagination and filtering)
router.get('/', verifyToken, getAllClients);

// Get a single client by ID
router.get('/:id', verifyToken, getClientById);

// Create a new client (requires gym staff permissions)
router.post('/', verifyToken, requireGymStaffAccess, createClient);

// Send an email invite to a new client
router.post('/invite', verifyToken, requireGymStaffAccess, sendClientInvite);

// Update a client
router.put('/:id', verifyToken, updateClient);

// Delete a client (admin_coach cannot delete clients)
router.delete('/:id', verifyToken, requireRole([UserType.ADMIN, UserType.OWNER, UserType.COACH]), deleteClient);

// Assign a program to a client
router.patch('/:id/program', verifyToken, assignProgram);

// Unassign a program from a client
router.delete('/:id/program', verifyToken, unassignProgram);

export default router;