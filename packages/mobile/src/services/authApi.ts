import { ApiResponse } from '@ironlogic4/shared';
import type { User } from '@ironlogic4/shared/types/users';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_BASE_URL}/api`;

export interface ValidateInviteTokenResponse {
  success: boolean;
  valid: boolean;
  data?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  message?: string;
}

export interface AcceptInviteRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
  message?: string;
}

/**
 * Validate a client invite token
 */
export async function validateInviteToken(token: string): Promise<ValidateInviteTokenResponse> {
  const response = await fetch(`${API_BASE}/auth/validate-invite-token?token=${encodeURIComponent(token)}`);
  return response.json();
}

/**
 * Accept a client invite and create an account
 */
export async function acceptInvite(data: AcceptInviteRequest): Promise<AcceptInviteResponse> {
  const response = await fetch(`${API_BASE}/auth/accept-invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create account');
  }

  return response.json();
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send password reset email');
  }

  return response.json();
}
