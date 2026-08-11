import { useState, useCallback, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../providers/AuthProvider';
import {
  getScheduleTemplates,
  addTemplateTimeslotClient,
  removeTemplateTimeslotClient,
} from '../services/scheduleApi';
import { flattenAndFilterToCoach, FlatCoachTimeslot } from '../utils/coachScheduleUtils';
import type { IScheduleTemplate } from '@ironlogic4/shared';
import type { DirectoryClient } from './useClientDirectory';

/**
 * Coach view of the gym's schedule template — only the timeslots this coach
 * coaches, with add/remove-client actions scoped to those timeslots.
 */
export function useCoachTemplate(clientMap: Map<string, DirectoryClient>) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<IScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getScheduleTemplates();
      setTemplates(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedule template');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const slots = useMemo(
    () => (user ? flattenAndFilterToCoach(templates, user.id, clientMap) : []),
    [templates, user, clientMap]
  );

  const addClient = useCallback(async (slot: FlatCoachTimeslot, clientId: string) => {
    setActionLoading((prev) => ({ ...prev, [slot.timeslotId]: true }));
    try {
      await addTemplateTimeslotClient(slot.scheduleId, slot.timeslotId, clientId);
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
      await removeTemplateTimeslotClient(slot.scheduleId, slot.timeslotId, clientId);
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
