import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
export declare const getAllActivityGroups: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getActivityGroupById: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createActivityGroup: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateActivityGroup: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteActivityGroup: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=activityGroups.d.ts.map