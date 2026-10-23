import { useState, useEffect, useCallback } from 'react';
import type { IAttendanceSummaryResponse } from '@ironlogic4/shared';
import { attendanceApi, type AttendanceRangeParams } from '../services/attendanceApi';

/**
 * Fetch per-client attendance counts for the gym over a date range
 */
export function useAttendanceSummary({ from, to, groupBy }: AttendanceRangeParams) {
  const [summary, setSummary] = useState<IAttendanceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!from || !to || from > to) return;

    setLoading(true);
    setError(null);
    try {
      const response = await attendanceApi.getSummary({ from, to, groupBy });
      setSummary(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [from, to, groupBy]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, loading, error };
}
