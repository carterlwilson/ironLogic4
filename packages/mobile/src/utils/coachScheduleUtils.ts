import type { IScheduleDay } from '@ironlogic4/shared';
import type { DirectoryClient } from '../hooks/useClientDirectory';

export interface FlatCoachTimeslot {
  timeslotId: string;
  scheduleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  location: string;
  assignedClients: { id: string; firstName?: string; lastName?: string }[];
}

interface ScheduleWithDays {
  id: string;
  days: IScheduleDay[];
}

/**
 * Flatten a list of schedules (templates or active schedules — both share the
 * same days/timeSlots shape) down to just the timeslots a specific coach
 * coaches, resolving assignedClients IDs to display names via clientMap.
 */
export function flattenAndFilterToCoach(
  schedules: ScheduleWithDays[],
  coachId: string,
  clientMap: Map<string, DirectoryClient>
): FlatCoachTimeslot[] {
  const flat: FlatCoachTimeslot[] = [];

  for (const schedule of schedules) {
    for (const day of schedule.days) {
      for (const timeSlot of day.timeSlots) {
        if (!timeSlot.coachIds.includes(coachId)) continue;

        flat.push({
          timeslotId: timeSlot.id,
          scheduleId: schedule.id,
          dayOfWeek: day.dayOfWeek,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          capacity: timeSlot.capacity,
          location: timeSlot.location,
          assignedClients: timeSlot.assignedClients.map((clientId) => {
            const client = clientMap.get(clientId);
            return {
              id: clientId,
              firstName: client?.firstName,
              lastName: client?.lastName,
            };
          }),
        });
      }
    }
  }

  return flat;
}
