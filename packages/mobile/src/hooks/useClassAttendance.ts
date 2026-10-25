import { useState, useCallback, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { AttendanceStatus } from '@ironlogic4/shared';
import { getClassAttendance, submitClassAttendance } from '../services/attendanceApi';
import type { FlatCoachTimeslot } from '../utils/coachScheduleUtils';

/**
 * Roster state for taking attendance on one class and date: signed-up
 * clients plus any walk-ins, each marked present or absent. Seeds from
 * anything already recorded; unrecorded signed-up clients default to present.
 */
export function useClassAttendance(slot: FlatCoachTimeslot, date: string) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [walkInIds, setWalkInIds] = useState<string[]>([]);
  const [alreadyRecorded, setAlreadyRecorded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getClassAttendance(slot.timeslotId, date);
      const signedUpIds = slot.assignedClients.map((c) => c.id);
      const seeded: Record<string, AttendanceStatus> = {};
      for (const id of signedUpIds) {
        seeded[id] = AttendanceStatus.PRESENT;
      }
      for (const record of response.data) {
        seeded[record.clientId] = record.status;
      }
      setStatuses(seeded);
      setWalkInIds(response.data.map((r) => r.clientId).filter((id) => !signedUpIds.includes(id)));
      setAlreadyRecorded(response.data.length > 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [slot, date]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = useCallback((clientId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [clientId]: status }));
  }, []);

  const addWalkIn = useCallback((clientId: string) => {
    setWalkInIds((prev) => (prev.includes(clientId) ? prev : [...prev, clientId]));
    setStatuses((prev) => ({ ...prev, [clientId]: AttendanceStatus.PRESENT }));
  }, []);

  const removeWalkIn = useCallback((clientId: string) => {
    setWalkInIds((prev) => prev.filter((id) => id !== clientId));
    setStatuses((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
  }, []);

  const { presentCount, absentCount } = useMemo(() => {
    const values = Object.values(statuses);
    return {
      presentCount: values.filter((s) => s === AttendanceStatus.PRESENT).length,
      absentCount: values.filter((s) => s === AttendanceStatus.ABSENT).length,
    };
  }, [statuses]);

  const submit = useCallback(async (): Promise<boolean> => {
    const entries = Object.entries(statuses).map(([clientId, status]) => ({ clientId, status }));
    if (entries.length === 0) return false;

    setSubmitting(true);
    try {
      await submitClassAttendance({ timeslotId: slot.timeslotId, date, entries });
      notifications.show({
        title: 'Attendance Saved',
        message: `${presentCount} present, ${absentCount} absent`,
        color: 'green',
      });
      return true;
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to save attendance',
        color: 'red',
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [statuses, slot.timeslotId, date, presentCount, absentCount]);

  return {
    statuses,
    walkInIds,
    alreadyRecorded,
    loading,
    submitting,
    error,
    presentCount,
    absentCount,
    setStatus,
    addWalkIn,
    removeWalkIn,
    submit,
  };
}
