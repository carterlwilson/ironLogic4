import { useState, useEffect, useCallback } from 'react';
import type { IClientAttendanceHistory } from '@ironlogic4/shared';
import { attendanceApi, type AttendanceRangeParams } from '../services/attendanceApi';

/**
 * Fetch one client's attendance history over a date range
 */
export function useClientAttendance(clientId: string | undefined, { from, to, groupBy }: AttendanceRangeParams) {
  const [history, setHistory] = useState<IClientAttendanceHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId || !from || !to || from > to) return;

    setLoading(true);
    setError(null);
    try {
      const response = await attendanceApi.getClientHistory(clientId, { from, to, groupBy });
      setHistory(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [clientId, from, to, groupBy]);

  useEffect(() => {
    load();
  }, [load]);

  return { history, loading, error };
}
