import { useState, useCallback, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../providers/AuthProvider';
import {
  getSessions,
  enrollInSession,
  unenrollFromSession,
  IClassSessionWithAvailability,
} from '../services/scheduleApi';

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function useClientSchedule() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<IClassSessionWithAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<'AM' | 'PM' | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  // Track locally which sessions the user is enrolled in
  const [enrolledSessionIds, setEnrolledSessionIds] = useState<Set<string>>(new Set());

  const loadSessions = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSessions({ date: toISODate(date) });
      setSessions(res.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(msg);
      notifications.show({ title: 'Error', message: msg, color: 'red' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.gymId) {
      loadSessions(selectedDate);
      // Reset enrolled set on date change
      setEnrolledSessionIds(new Set());
    }
  }, [user?.gymId, selectedDate, loadSessions]);

  const setDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const enroll = useCallback(async (sessionId: string) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: true }));
    // Optimistic
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, availableSpots: s.availableSpots - 1, enrolledCount: s.enrolledCount + 1 } : s
    ));
    setEnrolledSessionIds(prev => new Set(prev).add(sessionId));
    try {
      await enrollInSession(sessionId);
      notifications.show({ title: 'Success', message: 'You have joined this session!', color: 'green', autoClose: 3000 });
    } catch (err) {
      // Rollback
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, availableSpots: s.availableSpots + 1, enrolledCount: s.enrolledCount - 1 } : s
      ));
      setEnrolledSessionIds(prev => { const next = new Set(prev); next.delete(sessionId); return next; });
      const msg = err instanceof Error ? err.message : 'Failed to enroll';
      notifications.show({ title: 'Error', message: msg, color: 'red' });
    } finally {
      setActionLoading(prev => { const next = { ...prev }; delete next[sessionId]; return next; });
    }
  }, []);

  const unenroll = useCallback(async (sessionId: string) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: true }));
    // Optimistic
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, availableSpots: s.availableSpots + 1, enrolledCount: s.enrolledCount - 1 } : s
    ));
    setEnrolledSessionIds(prev => { const next = new Set(prev); next.delete(sessionId); return next; });
    try {
      await unenrollFromSession(sessionId);
      notifications.show({ title: 'Left session', message: 'You have left this session.', color: 'blue', autoClose: 3000 });
    } catch (err) {
      // Rollback
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, availableSpots: s.availableSpots - 1, enrolledCount: s.enrolledCount + 1 } : s
      ));
      setEnrolledSessionIds(prev => new Set(prev).add(sessionId));
      const msg = err instanceof Error ? err.message : 'Failed to unenroll';
      notifications.show({ title: 'Error', message: msg, color: 'red' });
    } finally {
      setActionLoading(prev => { const next = { ...prev }; delete next[sessionId]; return next; });
    }
  }, []);

  const filteredSessions = useMemo(() => {
    if (!period) return sessions;
    return sessions.filter(s => {
      const hour = parseInt(s.startTime.split(':')[0], 10);
      return period === 'AM' ? hour < 12 : hour >= 12;
    });
  }, [sessions, period]);

  return {
    sessions,
    filteredSessions,
    selectedDate,
    period,
    loading,
    actionLoading,
    error,
    enrolledSessionIds,
    setDate,
    setPeriod,
    enroll,
    unenroll,
    refresh: () => loadSessions(selectedDate),
  };
}
