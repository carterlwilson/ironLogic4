import { useState, useEffect, useCallback, useRef } from 'react';
import type { IAttendanceSummaryResponse } from '@ironlogic4/shared';
import { attendanceApi, type AttendanceSummaryParams } from '../services/attendanceApi';

/**
 * Fetch one page of per-client attendance counts for the gym over a date range
 */
export function useAttendanceSummary({ from, to, groupBy, search, page, limit }: AttendanceSummaryParams) {
  const [summary, setSummary] = useState<IAttendanceSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    if (!from || !to || from > to) return;

    // Ignore responses that arrive after a newer request was made
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError(null);
    try {
      const response = await attendanceApi.getSummary({ from, to, groupBy, search, page, limit });
      if (requestId !== latestRequest.current) return;
      setSummary(response.data ?? null);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [from, to, groupBy, search, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, loading, error };
}
