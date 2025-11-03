import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
/**
 * Get all programs with pagination and filtering
 */
export declare const getAllPrograms: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get program by ID
 */
export declare const getProgramById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create new program
 */
export declare const createProgram: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update program by ID
 */
export declare const updateProgram: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete program by ID (soft delete - sets isActive to false)
 */
export declare const deleteProgram: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=programs.d.ts.map