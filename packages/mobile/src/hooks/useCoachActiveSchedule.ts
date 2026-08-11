import { useState, useCallback, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../providers/AuthProvider';
import {
  getActiveSchedules,
  addActiveTimeslotClient,
  removeActiveTimeslotClient,
} from '../services/scheduleApi';
import { flattenAndFilterToCoach, FlatCoachTimeslot } from '../utils/coachScheduleUtils';
import type { IActiveSchedule } from '@ironlogic4/shared';
import type { DirectoryClient } from './useClientDirectory';

/**
 * Coach view of the gym's active schedule — only the timeslots this coach
 * coaches, with add/remove-client actions scoped to those timeslots.
 */
export function useCoachActiveSchedule(clientMap: Map<string, DirectoryClient>) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<IActiveSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getActiveSchedules();
      setSchedules(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const slots = useMemo(
    () => (user ? flattenAndFilterToCoach(schedules, user.id, clientMap) : []),
    [schedules, user, clientMap]
  );

  const addClient = useCallback(async (slot: FlatCoachTimeslot, clientId: string) => {
    setActionLoading((prev) => ({ ...prev, [slot.timeslotId]: true }));
    try {
      await addActiveTimeslotClient(slot.scheduleId, slot.timeslotId, clientId);
      await refresh();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to add client',
        color: 'red',
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [slot.timeslotId]: false }));
    }
  }, [refresh]);

  const removeClient = useCallback(async (slot: FlatCoachTimeslot, clientId: string) => {
    setActionLoading((prev) => ({ ...prev, [slot.timeslotId]: true }));
    try {
      await removeActiveTimeslotClient(slot.scheduleId, slot.timeslotId, clientId);
      await refresh();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to remove client',
        color: 'red',
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [slot.timeslotId]: false }));
    }
  }, [refresh]);

  return { slots, loading, error, refresh, addClient, removeClient, actionLoading };
}
