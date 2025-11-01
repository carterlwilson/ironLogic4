import { CurrentWeekWorkoutResponse } from '@ironlogic4/shared';

const API_BASE = '/api';

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string {
  const authTokens = localStorage.getItem('authTokens');
  if (!authTokens) {
    throw new Error('No authentication token found');
  }
  const { accessToken } = JSON.parse(authTokens);
  return accessToken;
}

/**
 * Fetch current week workout data
 */
export async function getCurrentWeekWorkout(): Promise<CurrentWeekWorkoutResponse> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}/me/workouts/current-week`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch current week workout');
  }

  return response.json();
}