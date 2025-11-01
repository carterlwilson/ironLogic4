"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const clients_1 = require("../../controllers/clients");
const router = express_1.default.Router();
// List all clients (with pagination and filtering)
router.get('/', auth_1.verifyToken, clients_1.getAllClients);
// Get a single client by ID
router.get('/:id', auth_1.verifyToken, clients_1.getClientById);
// Create a new client (requires owner or admin permissions)
router.post('/', auth_1.verifyToken, auth_1.requireOwnerOrAdminForGym, clients_1.createClient);
// Update a client
router.put('/:id', auth_1.verifyToken, clients_1.updateClient);
// Delete a client
router.delete('/:id', auth_1.verifyToken, clients_1.deleteClient);
// Assign a program to a client
router.patch('/:id/program', auth_1.verifyToken, clients_1.assignProgram);
// Unassign a program from a client
router.delete('/:id/program', auth_1.verifyToken, clients_1.unassignProgram);
exports.default = router;
//# sourceMappingURL=clients.js.map