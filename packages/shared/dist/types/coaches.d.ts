import { User } from './users.js';
import { CoachListParamsInput, CreateCoachInput, UpdateCoachInput, ResetCoachPasswordInput, CoachIdInput } from '../schemas/coaches.js';
/**
 * Coach response type (excludes password)
 */
export type CoachResponse = Omit<User, 'password'>;
/**
 * Coach list response with pagination
 */
export interface CoachListResponse {
    coaches: CoachResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
/**
 * Create coach response (may include temporary password if auto-generated)
 */
export interface CreateCoachResponse extends CoachResponse {
    temporaryPassword?: string;
}
/**
 * Reset password response (may include temporary password if auto-generated)
 */
export interface ResetCoachPasswordResponse {
    success: boolean;
    message: string;
    temporaryPassword?: string;
}
/**
 * Request/input types
 */
export type CoachListParams = CoachListParamsInput;
export type CreateCoachRequest = CreateCoachInput;
export type UpdateCoachRequest = UpdateCoachInput;
export type ResetCoachPasswordRequest = ResetCoachPasswordInput;
export type CoachIdParams = CoachIdInput;
//# sourceMappingURL=coaches.d.ts.map