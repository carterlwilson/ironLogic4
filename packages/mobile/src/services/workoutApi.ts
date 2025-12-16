import { CurrentWeekWorkoutResponse } from '@ironlogic4/shared';
import { apiRequest } from './api';

/**
 * Fetch current week workout data
 */
export async function getCurrentWeekWorkout(): Promise<CurrentWeekWorkoutResponse> {
  return apiRequest<CurrentWeekWorkoutResponse>('/api/me/workouts/current-week');
}