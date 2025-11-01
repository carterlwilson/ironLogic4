import { useState, useCallback, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import {
  getAvailableSchedules,
  joinTimeslot,
  leaveTimeslot,
  IActiveScheduleWithAvailability,
} from '../services/scheduleApi';
import { useAuth } from '../providers/AuthProvider';
import { ITimeslotWithAvailability } from '@ironlogic4/shared';

interface ScheduleState {
  schedules: IActiveScheduleWithAvailability[];
  selectedCoachId: string | null;
  loading: boolean;
  error: string | null;
  actionLoading: { [timeslotId: string]: boolean };
}

interface CoachData {
  id: string;
  name: string;
  totalSpots: number;
  availableSpots: number;
  userBookings: number;
}

interface TimeslotWithSchedule extends ITimeslotWithAvailability {
  scheduleId: string;
  dayOfWeek: number;
}

export function useSchedule() {
  const { user } = useAuth();
  const [state, setState] = useState<ScheduleState>({
    schedules: [],
    selectedCoachId: null,
    loading: false,
    error: null,
    actionLoading: {},
  });

  /**
   * Load schedules from API
   */
  const loadSchedules = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await getAvailableSchedules();
      setState((prev) => ({
        ...prev,
        schedules: response.data || [],
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load schedules';
      setState((prev) => ({
        ...prev,
        schedules: [],
        loading: false,
        error: errorMessage,
      }));
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, []);

  /**
   * Select a coach to view their timeslots
   */
  const selectCoach = useCallback((coachId: string | null) => {
    setState((prev) => ({ ...prev, selectedCoachId: coachId }));
  }, []);

  /**
   * Join a timeslot with optimistic update
   */
  const handleJoinTimeslot = useCallback(
    async (scheduleId: string, timeslotId: string) => {
      if (!user) return;

      // Save current state for rollback
      const previousSchedules = state.schedules;

      // Set loading state for this specific timeslot
      setState((prev) => ({
        ...prev,
        actionLoading: { ...prev.actionLoading, [timeslotId]: true },
      }));

      // Optimistic update
      setState((prev) => ({
        ...prev,
        schedules: prev.schedules.map((schedule) => {
          if (schedule.id !== scheduleId) return schedule;

          return {
            ...schedule,
            days: schedule.days.map((day) => ({
              ...day,
              timeSlots: day.timeSlots.map((slot) => {
                if (slot.id !== timeslotId) return slot;

                return {
                  ...slot,
                  assignedClients: [...slot.assignedClients, user.id],
                  availableSpots: slot.availableSpots - 1,
                  isUserAssigned: true,
                };
              }),
            })),
          };
        }),
      }));

      try {
        await joinTimeslot(scheduleId, timeslotId);

        notifications.show({
          title: 'Success',
          message: 'You have joined this timeslot!',
          color: 'green',
          autoClose: 3000,
        });

        // Refresh data to ensure consistency
        await loadSchedules();
      } catch (error) {
        // Rollback on error
        setState((prev) => ({
          ...prev,
          schedules: previousSchedules,
        }));

        const errorMessage = error instanceof Error ? error.message : 'Failed to join timeslot';
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          autoClose: 5000,
        });
      } finally {
        setState((prev) => {
          const newActionLoading = { ...prev.actionLoading };
          delete newActionLoading[timeslotId];
          return { ...prev, actionLoading: newActionLoading };
        });
      }
    },
    [state.schedules, user, loadSchedules]
  );

  /**
   * Leave a timeslot with optimistic update
   */
  const handleLeaveTimeslot = useCallback(
    async (scheduleId: string, timeslotId: string) => {
      if (!user) return;

      // Save current state for rollback
      const previousSchedules = state.schedules;

      // Set loading state for this specific timeslot
      setState((prev) => ({
        ...prev,
        actionLoading: { ...prev.actionLoading, [timeslotId]: true },
      }));

      // Optimistic update
      setState((prev) => ({
        ...prev,
        schedules: prev.schedules.map((schedule) => {
          if (schedule.id !== scheduleId) return schedule;

          return {
            ...schedule,
            days: schedule.days.map((day) => ({
              ...day,
              timeSlots: day.timeSlots.map((slot) => {
                if (slot.id !== timeslotId) return slot;

                return {
                  ...slot,
                  assignedClients: slot.assignedClients.filter((id) => id !== user.id),
                  availableSpots: slot.availableSpots + 1,
                  isUserAssigned: false,
                };
              }),
            })),
          };
        }),
      }));

      try {
        await leaveTimeslot(scheduleId, timeslotId);

        notifications.show({
          title: 'Success',
          message: 'You have left this timeslot.',
          color: 'blue',
          autoClose: 3000,
        });

        // Refresh data to ensure consistency
        await loadSchedules();
      } catch (error) {
        // Rollback on error
        setState((prev) => ({
          ...prev,
          schedules: previousSchedules,
        }));

        const errorMessage = error instanceof Error ? error.message : 'Failed to leave timeslot';
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          autoClose: 5000,
        });
      } finally {
        setState((prev) => {
          const newActionLoading = { ...prev.actionLoading };
          delete newActionLoading[timeslotId];
          return { ...prev, actionLoading: newActionLoading };
        });
      }
    },
    [state.schedules, user, loadSchedules]
  );

  /**
   * Computed: Get coach data for all coaches
   */
  const coachesData = useMemo((): CoachData[] => {
    // Group schedules by coach
    const coachMap = new Map<string, CoachData>();

    state.schedules.forEach((schedule) => {
      // Use the coaches array from the API response if available
      const scheduleCoaches = (schedule as any).coaches || [];

      schedule.coachIds.forEach((coachId) => {
        if (!coachMap.has(coachId)) {
          // Find coach details from the schedule's coaches array
          const coachDetails = scheduleCoaches.find((c: any) => c.id === coachId);
          const coachName = coachDetails
            ? `${coachDetails.firstName} ${coachDetails.lastName}`.trim() || coachDetails.email
            : `Coach ${coachId.slice(-4)}`; // Fallback to ID if not found

          coachMap.set(coachId, {
            id: coachId,
            name: coachName,
            totalSpots: 0,
            availableSpots: 0,
            userBookings: 0,
          });
        }

        const coachData = coachMap.get(coachId)!;

        schedule.days.forEach((day) => {
          day.timeSlots.forEach((slot) => {
            coachData.totalSpots += slot.capacity;
            coachData.availableSpots += slot.availableSpots;
            if (slot.isUserAssigned) {
              coachData.userBookings += 1;
            }
          });
        });
      });
    });

    return Array.from(coachMap.values());
  }, [state.schedules]);

  /**
   * Computed: Get selected coach data
   */
  const selectedCoach = useMemo((): CoachData | null => {
    if (!state.selectedCoachId) return null;
    return coachesData.find((c) => c.id === state.selectedCoachId) || null;
  }, [state.selectedCoachId, coachesData]);

  /**
   * Computed: Get timeslots for selected coach grouped by day
   */
  const timeslotsByDay = useMemo((): Map<number, TimeslotWithSchedule[]> => {
    if (!state.selectedCoachId) return new Map();

    const dayMap = new Map<number, TimeslotWithSchedule[]>();

    state.schedules.forEach((schedule) => {
      if (!schedule.coachIds.includes(state.selectedCoachId!)) return;

      schedule.days.forEach((day) => {
        if (!dayMap.has(day.dayOfWeek)) {
          dayMap.set(day.dayOfWeek, []);
        }

        const timeslotsWithSchedule = day.timeSlots.map((slot: any) => ({
          ...slot,
          id: slot.id,
          scheduleId: schedule.id,
          dayOfWeek: day.dayOfWeek,
        }));

        dayMap.get(day.dayOfWeek)!.push(...timeslotsWithSchedule);
      });
    });

    // Sort timeslots within each day by start time
    dayMap.forEach((slots) => {
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return dayMap;
  }, [state.schedules, state.selectedCoachId]);

  /**
   * Computed: Get user's timeslots grouped by coach
   */
  const userTimeslotsByCoach = useMemo((): Map<string, TimeslotWithSchedule[]> => {
    const coachMap = new Map<string, TimeslotWithSchedule[]>();

    state.schedules.forEach((schedule) => {
      schedule.coachIds.forEach((coachId) => {
        if (!coachMap.has(coachId)) {
          coachMap.set(coachId, []);
        }

        schedule.days.forEach((day) => {
          day.timeSlots
            .filter((slot) => slot.isUserAssigned)
            .forEach((slot: any) => {
              coachMap.get(coachId)!.push({
                ...slot,
                id: slot.id,
                scheduleId: schedule.id,
                dayOfWeek: day.dayOfWeek,
              });
            });
        });
      });
    });

    return coachMap;
  }, [state.schedules]);

  /**
   * Load schedules on mount
   */
  useEffect(() => {
    if (user?.gymId) {
      loadSchedules();
    }
  }, [user?.gymId, loadSchedules]);

  return {
    // Data
    schedules: state.schedules,
    coachesData,
    selectedCoach,
    selectedCoachId: state.selectedCoachId,
    timeslotsByDay,
    userTimeslotsByCoach,
    loading: state.loading,
    error: state.error,
    actionLoading: state.actionLoading,

    // Actions
    loadSchedules,
    selectCoach,
    joinTimeslot: handleJoinTimeslot,
    leaveTimeslot: handleLeaveTimeslot,
  };
}