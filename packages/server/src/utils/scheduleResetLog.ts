import { ScheduleResetLog } from '../models/ScheduleResetLog.js';

// Fire-and-forget: an audit-log write failure must never turn a successful
// (or failed) schedule reset into something worse, so errors are caught and
// logged here rather than propagated to the caller.
export async function logScheduleReset(params: {
  gymId: string;
  activeScheduleId: string;
  templateId?: string;
  triggeredBy: 'cron' | 'manual';
  success: boolean;
  error?: string;
}): Promise<void> {
  try {
    await ScheduleResetLog.create(params);
  } catch (error) {
    console.error('[SCHEDULE_RESET_LOG] Failed to record reset audit log:', error);
  }
}
