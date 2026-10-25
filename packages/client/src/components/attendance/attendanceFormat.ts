import { parseDateString, type AttendanceGroupBy } from '@ironlogic4/shared';

/** Column label for a period start: "Oct 4" for weeks, "Oct 2026" for months */
export function formatPeriodLabel(periodStart: string, groupBy: AttendanceGroupBy): string {
  const date = parseDateString(periodStart);
  return groupBy === 'month'
    ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Present as a share of all recorded classes, or a dash when nothing was recorded */
export function formatAttendanceRate(present: number, absent: number): string {
  const total = present + absent;
  return total === 0 ? '—' : `${Math.round((present / total) * 100)}%`;
}
