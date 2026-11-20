import { ActiveSchedule, ActiveScheduleDocument } from '../models/ActiveSchedule.js';
import { ScheduleTemplate } from '../models/ScheduleTemplate.js';
import { ScheduleResetLog, ScheduleResetTrigger } from '../models/ScheduleResetLog.js';
import { Gym } from '../models/Gym.js';
import { isWeeklyResetDue } from '../utils/weeklyReset.js';

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
 * Reset every active schedule whose gym has reached its weekly reset time
 * (Saturday 23:59 in the gym's time zone) and hasn't been reset since. Safe
 * to call repeatedly: a schedule is reset once per week. Each schedule is
 * reset independently, so a failure on one gym's schedule does not prevent
 * the others from resetting.
 */
export async function resetDueActiveSchedules(now: Date = new Date()): Promise<ResetAllSummary> {
  const schedules = await ActiveSchedule.find();
  const gyms = await Gym.find({ _id: { $in: schedules.map((s) => s.gymId) } }).select('timezone');
  const timeZoneByGym = new Map(gyms.map((gym) => [gym.id as string, gym.timezone]));

  let resetCount = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      const timeZone = timeZoneByGym.get(schedule.gymId.toString());
      if (!timeZone) {
        throw new Error('Gym has no time zone set, so its schedule never resets');
      }
      if (!isWeeklyResetDue(schedule.lastResetAt, now, timeZone)) {
        continue;
      }
      await resetScheduleFromTemplate(schedule);
      resetCount++;
    } catch (err) {
      errors.push(`Schedule ${schedule.id} (gym ${schedule.gymId}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { resetCount, failedCount: errors.length, errors };
}

/**
 * Runs the active-schedule reset and persists a ScheduleResetLog record of
 * the outcome, so resets, failures, and successes survive past the
 * ephemeral console logs on hosts (e.g. Railway) that recycle processes.
 *
 * resetDueActiveSchedules() only catches per-schedule errors; this wrapper
 * also catches a total failure of the job itself (e.g. the initial
 * ActiveSchedule.find() rejecting), which previously went completely
 * unlogged - node-cron swallows an unhandled rejection from a scheduled
 * task unless a caller attaches its own try/catch.
 */
export async function runScheduleResetJob(trigger: ScheduleResetTrigger): Promise<ResetAllSummary> {
  const startedAt = new Date();

  let summary: ResetAllSummary;
  try {
    summary = await resetDueActiveSchedules(startedAt);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[SCHEDULE-RESET] Job failed before completing:', err);
    await persistResetLog(trigger, startedAt, { resetCount: 0, failedCount: 0, errors: [message] }, 'failure');
    throw err;
  }

  // The cron ticks every 15 minutes; only log runs that reset or failed something
  if (summary.resetCount === 0 && summary.failedCount === 0) {
    return summary;
  }

  const status = summary.failedCount === 0 ? 'success' : summary.resetCount === 0 ? 'failure' : 'partial_failure';
  console.log(`[SCHEDULE-RESET] Done. Reset: ${summary.resetCount}, Failed: ${summary.failedCount}`);
  if (summary.errors.length) {
    console.error('[SCHEDULE-RESET] Errors:', summary.errors);
  }

  await persistResetLog(trigger, startedAt, summary, status);
  return summary;
}

async function persistResetLog(
  trigger: ScheduleResetTrigger,
  startedAt: Date,
  summary: ResetAllSummary,
  status: 'success' | 'partial_failure' | 'failure'
): Promise<void> {
  try {
    await ScheduleResetLog.create({
      trigger,
      status,
      resetCount: summary.resetCount,
      failedCount: summary.failedCount,
      errorMessages: summary.errors,
      durationMs: Date.now() - startedAt.getTime(),
      startedAt,
    });
  } catch (logErr) {
    console.error('[SCHEDULE-RESET] Failed to persist reset log:', logErr);
  }
}
