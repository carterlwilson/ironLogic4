import { ActiveSchedule } from '../models/ActiveSchedule.js';
import { ScheduleTemplate } from '../models/ScheduleTemplate.js';

// Deleting a client must also remove their assigned-clients entries from every
// timeslot in both active schedules and templates — otherwise the dangling ID
// keeps shrinking availableSpots, and a template reset (scheduleReset.ts) would
// re-introduce it into the active schedule even after this cleans that up.
export async function removeClientScheduleAssignments(clientId: string): Promise<void> {
  await Promise.all([
    ActiveSchedule.updateMany(
      { 'days.timeSlots.assignedClients': clientId },
      { $pull: { 'days.$[].timeSlots.$[].assignedClients': clientId } }
    ),
    ScheduleTemplate.updateMany(
      { 'days.timeSlots.assignedClients': clientId },
      { $pull: { 'days.$[].timeSlots.$[].assignedClients': clientId } }
    ),
  ]);
}
