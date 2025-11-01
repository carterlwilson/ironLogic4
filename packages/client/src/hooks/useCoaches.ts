import { useState, useEffect } from 'react';
import { coachApi } from '../services/coachApi';
import type { CoachResponse } from '@ironlogic4/shared/types/coaches';

export interface Coach {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'coach' | 'admin' | 'owner';
}

/**
 * Hook to fetch and manage coaches for the current gym
 * Uses /api/gym/coaches endpoint (owner and admin accessible)
 * Returns coaches who can be assigned to schedules (coach, admin, owner roles)
 *
 * @param gymId - The gym ID to fetch coaches for (used for cache key, server handles scoping)
 * @returns { coaches, loading, error }
 */
export function useCoaches(gymId: string | undefined) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gymId) {
      setCoaches([]);
      return;
    }

    const fetchCoaches = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch coaches using the gym-scoped endpoint
        // Server automatically filters by user's gym (for owners) or gymId param (for admins)
        const response = await coachApi.getCoaches({
          limit: 100, // Get up to 100 coaches (most gyms have <100)
          page: 1,
        });

        // Transform CoachResponse to Coach interface for backward compatibility
        const coachList: Coach[] = (response.data || []).map((coach: CoachResponse) => ({
          id: coach.id,
          email: coach.email,
          firstName: coach.firstName,
          lastName: coach.lastName,
          role: coach.userType.toLowerCase() as 'coach' | 'admin' | 'owner',
        }));

        setCoaches(coachList);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch coaches';
        console.error('Failed to fetch coaches:', errorMessage);
        setError(errorMessage);
        setCoaches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, [gymId]);

  return { coaches, loading, error };
}