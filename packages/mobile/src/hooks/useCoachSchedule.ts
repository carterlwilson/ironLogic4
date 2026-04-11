import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../providers/AuthProvider';
import {
  getSessionsByCoachDay,
  getSessionsByCoachWeek,
  submitAttendance as submitAttendanceApi,
  ISessionWithRoster,
} from '../services/scheduleApi';
import type { IClassSession } from '@ironlogic4/shared';

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function useCoachSchedule() {
  const { user } = useAuth();
  const [view, setView] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [daySessions, setDaySessions] = useState<ISessionWithRoster[]>([]);
  const [weekSessions, setWeekSessions] = useState<(IClassSession & { enrolledCount: number })[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDaySessions = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSessionsByCoachDay(toISODate(date));
      setDaySessions(res.data || []);
      setSelectedSessionId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWeekSessions = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const monday = getMondayOfWeek(date);
      const res = await getSessionsByCoachWeek(toISODate(monday));
      setWeekSessions(res.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load week sessions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.gymId) return;
    if (view === 'day') {
      loadDaySessions(selectedDate);
    } else {
      loadWeekSessions(selectedDate);
    }
  }, [user?.gymId, view, selectedDate, loadDaySessions, loadWeekSessions]);

  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
      return d;
    });
  }, []);

  const selectSession = useCallback((session: ISessionWithRoster) => {
    setSelectedSessionId(session.id);
    // Initialize attendance map with 'present' for all enrolled clients
    const initial: Record<string, 'present' | 'absent' | 'late'> = {};
    session.roster.forEach(({ client }) => {
      if (client) initial[client.id] = 'present';
    });
    setAttendance(initial);
  }, []);

  const setAttendanceStatus = useCallback((clientId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [clientId]: status }));
  }, []);

  const handleSubmitAttendance = useCallback(async (sessionId: string) => {
    setAttendanceLoading(true);
    try {
      const records = Object.entries(attendance).map(([clientId, status]) => ({ clientId, status }));
      await submitAttendanceApi(sessionId, records);
      notifications.show({ title: 'Attendance saved', message: 'Attendance has been recorded.', color: 'green', autoClose: 3000 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save attendance';
      notifications.show({ title: 'Error', message: msg, color: 'red' });
    } finally {
      setAttendanceLoading(false);
    }
  }, [attendance]);

  const setDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return {
    view,
    selectedDate,
    daySessions,
    weekSessions,
    selectedSessionId,
    attendance,
    attendanceLoading,
    loading,
    error,
    setView,
    navigateDay,
    selectSession,
    setAttendanceStatus,
    submitAttendance: handleSubmitAttendance,
    setDate,
    getMondayOfWeek,
  };
}
