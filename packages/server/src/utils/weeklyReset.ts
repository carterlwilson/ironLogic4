// Each gym's active schedule resets Saturdays at 23:59 in the gym's own time zone.
const RESET_WEEKDAY = 6; // Saturday
const RESET_HOUR = 23;
const RESET_MINUTE = 59;

/**
 * How long after a gym's reset time a reset may still run. Covers a cron
 * tick that was skipped (e.g. during a deploy) without resetting a schedule
 * well into the new week, after clients have started signing up.
 */
export const RESET_WINDOW_MS = 60 * 60 * 1000;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0-6, Sunday-Saturday
}

function wallClock(date: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    weekday: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    weekday: WEEKDAYS.indexOf(get('weekday')),
  };
}

/** Offset of `timeZone` from UTC at `date`, in ms (to the minute). */
function offsetMs(date: Date, timeZone: string): number {
  const w = wallClock(date, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  return asUtc - Math.floor(date.getTime() / 60000) * 60000;
}

/** The instant the wall-clock time y-m-d h:min occurs in `timeZone`. */
function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const firstGuess = asUtc - offsetMs(new Date(asUtc), timeZone);
  // Re-check in case the first guess landed across a DST change
  return new Date(asUtc - offsetMs(new Date(firstGuess), timeZone));
}

/** The most recent Saturday 23:59 in `timeZone` at or before `now`. */
export function lastResetBoundary(now: Date, timeZone: string): Date {
  const w = wallClock(now, timeZone);
  const daysSinceSaturday = (w.weekday - RESET_WEEKDAY + 7) % 7;
  // Date.UTC normalizes day underflow, so this is just calendar arithmetic
  const saturday = new Date(Date.UTC(w.year, w.month - 1, w.day - daysSinceSaturday));
  let boundary = zonedTimeToUtc(
    saturday.getUTCFullYear(), saturday.getUTCMonth() + 1, saturday.getUTCDate(), RESET_HOUR, RESET_MINUTE, timeZone
  );
  if (boundary.getTime() > now.getTime()) {
    // It's Saturday before 23:59 - the last reset was a week ago
    boundary = zonedTimeToUtc(
      saturday.getUTCFullYear(), saturday.getUTCMonth() + 1, saturday.getUTCDate() - 7, RESET_HOUR, RESET_MINUTE, timeZone
    );
  }
  return boundary;
}

/**
 * Whether a schedule last reset at `lastResetAt` is due for its weekly reset
 * at `now`: the gym's Saturday 23:59 passed within RESET_WINDOW_MS and the
 * schedule hasn't been reset since. Running this again after the reset
 * returns false, so repeated cron ticks reset each schedule once per week.
 */
export function isWeeklyResetDue(lastResetAt: Date, now: Date, timeZone: string): boolean {
  const boundary = lastResetBoundary(now, timeZone);
  return now.getTime() - boundary.getTime() < RESET_WINDOW_MS && lastResetAt.getTime() < boundary.getTime();
}
