import { ApiResponse } from '@ironlogic4/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_BASE_URL}/api`;

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
