import { ActiveSchedule, ActiveScheduleDocument } from '../models/ActiveSchedule.js';
import { ScheduleTemplate } from '../models/ScheduleTemplate.js';

/**
 * Reset a single active schedule to exactly match its template — structure,
 * capacity, coaches, location, and client assignments all come fresh from
 * the template, discarding anything active-schedule-specific.
 */
export async function resetScheduleFromTemplate(schedule: ActiveScheduleDocument): Promise<void> {
  const template = await ScheduleTemplate.findById(schedule.templateId);
  if (!template) {
    throw new Error('Schedule template not found');
  }

  // Note: Using toObject() here because we're assigning to Mongoose document fields
  schedule.days = template.days.map((templateDay) => templateDay.toObject());
  schedule.lastResetAt = new Date();

  await schedule.save();
}

export interface ResetAllSummary {
  resetCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Reset every gym's active schedule to match its template. Used by the
 * weekly automated reset job. Each schedule is reset independently — a
 * failure on one gym's schedule does not prevent the others from resetting.
 */
export async function resetAllActiveSchedules(): Promise<ResetAllSummary> {
  const schedules = await ActiveSchedule.find();

  let resetCount = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      await resetScheduleFromTemplate(schedule);
      resetCount++;
    } catch (err) {
      errors.push(`Schedule ${schedule.id} (gym ${schedule.gymId}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { resetCount, failedCount: errors.length, errors };
}
