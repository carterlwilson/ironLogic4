import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
/**
 * Get all benchmark templates with pagination, search, and filtering
 */
export declare const getAllBenchmarkTemplates: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Get a single benchmark template by ID
 */
export declare const getBenchmarkTemplateById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Create a new benchmark template
 */
export declare const createBenchmarkTemplate: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Update a benchmark template
 */
export declare const updateBenchmarkTemplate: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Delete a benchmark template
 */
export declare const deleteBenchmarkTemplate: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=benchmarkTemplates.d.ts.map