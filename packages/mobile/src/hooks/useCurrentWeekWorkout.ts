import { useState, useEffect } from 'react';
import { CurrentWeekWorkoutResponse } from '@ironlogic4/shared';
import { getCurrentWeekWorkout } from '../services/workoutApi';

interface UseCurrentWeekWorkoutResult {
  data: CurrentWeekWorkoutResponse['data'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCurrentWeekWorkout(): UseCurrentWeekWorkoutResult {
  const [data, setData] = useState<CurrentWeekWorkoutResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCurrentWeekWorkout();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}