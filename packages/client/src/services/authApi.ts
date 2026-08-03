import type { ApiResponse } from '@ironlogic4/shared/types/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Request password reset email
 * Sends a password reset link to the user's email address
 */
export async function forgotPassword(email: string): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || 'Failed to send password reset email');
  }
}

/**
 * Reset password with token
 * Uses the token from the email link to set a new password
 */
export async function resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || 'Failed to reset password');
  }
}

/**
 * Validate reset token
 * Checks if the reset token is valid and not expired
 */
export async function validateResetToken(token: string): Promise<{ success: boolean; valid: boolean }> {
  const response = await fetch(`${API_BASE}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || 'Failed to validate reset token');
  }
}
