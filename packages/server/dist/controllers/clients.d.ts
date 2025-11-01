import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
/**
 * Get all clients with pagination, search, and gym scoping
 */
export declare const getAllClients: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get a single client by ID
 */
export declare const getClientById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create a new client
 */
export declare const createClient: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update a client
 */
export declare const updateClient: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete a client
 */
export declare const deleteClient: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Assign a program to a client
 */
export declare const assignProgram: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Unassign a program from a client
 */
export declare const unassignProgram: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=clients.d.ts.map