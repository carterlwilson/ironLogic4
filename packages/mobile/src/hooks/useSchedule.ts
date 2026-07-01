import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
  getAvailableSchedules,
  joinTimeslot as joinTimeslotApi,
  leaveTimeslot as leaveTimeslotApi,
  IActiveScheduleWithAvailability,
} from '../services/scheduleApi';

export interface FlatTimeslot {
  timeslotId: string;
  scheduleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSpots: number;
  isUserAssigned: boolean;
  coaches: { id: string; firstName: string; lastName: string }[];
}

// The shared IActiveSchedule type only has `coachIds`, but this endpoint also
// attaches a `coaches` array (id/firstName/lastName) to each schedule at runtime.
type ScheduleWithCoaches = IActiveScheduleWithAvailability & {
  coaches: { id: string; firstName: string; lastName: string }[];
};

function flattenSchedules(schedules: IActiveScheduleWithAvailability[]): FlatTimeslot[] {
  const flat: FlatTimeslot[] = [];

  for (const schedule of schedules as ScheduleWithCoaches[]) {
    const coaches = schedule.coaches ?? [];
    for (const day of schedule.days) {
      for (const timeSlot of day.timeSlots) {
        flat.push({
          timeslotId: timeSlot.id,
          scheduleId: schedule.id,
          dayOfWeek: day.dayOfWeek,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          capacity: timeSlot.capacity,
          availableSpots: timeSlot.availableSpots,
          isUserAssigned: timeSlot.isUserAssigned,
          coaches,
        });
      }
    }
  }

  return flat;
}

export function useSchedule() {
  const [flatSlots, setFlatSlots] = useState<FlatTimeslot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAvailableSchedules();
      setFlatSlots(flattenSchedules(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schedule';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const joinTimeslot = useCallback(async (slot: FlatTimeslot) => {
    setActionLoading((prev) => ({ ...prev, [slot.timeslotId]: true }));
    try {
      await joinTimeslotApi(slot.scheduleId, slot.timeslotId);
      await refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join timeslot';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [slot.timeslotId]: false }));
    }
  }, [refresh]);

  const leaveTimeslot = useCallback(async (slot: FlatTimeslot) => {
    setActionLoading((prev) => ({ ...prev, [slot.timeslotId]: true }));
    try {
      await leaveTimeslotApi(slot.scheduleId, slot.timeslotId);
      await refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave timeslot';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [slot.timeslotId]: false }));
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mySlots = flatSlots.filter((slot) => slot.isUserAssigned);
  const availableSlots = flatSlots.filter((slot) => slot.availableSpots > 0 && !slot.isUserAssigned);

  return {
    mySlots,
    availableSlots,
    loading,
    error,
    refresh,
    joinTimeslot,
    leaveTimeslot,
    actionLoading,
  };
}
