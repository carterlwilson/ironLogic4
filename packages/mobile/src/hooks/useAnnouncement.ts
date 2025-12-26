import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import type { Announcement } from '@ironlogic4/shared/types/announcements';
import type { ApiResponse } from '@ironlogic4/shared/types/api';

interface UseAnnouncementResult {
  announcement: Announcement | null;
  loading: boolean;
  error: Error | null;
}

export function useAnnouncement(): UseAnnouncementResult {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const response = await apiRequest<ApiResponse<Announcement | null>>('/api/gym/announcements');

        if (response.success) {
          setAnnouncement(response.data ?? null);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch announcement:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, []);

  return { announcement, loading, error };
}
