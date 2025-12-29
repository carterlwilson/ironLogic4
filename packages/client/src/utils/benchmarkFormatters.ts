import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import { RepMax } from '@ironlogic4/shared/types/clientBenchmarks';

/**
 * Formats a measurement value based on the benchmark type
 */
export function formatMeasurement(
  type: BenchmarkType,
  weightKg?: number,
  timeSeconds?: number,
  reps?: number,
  otherNotes?: string,
  repMaxes?: RepMax[]
): string {
  switch (type) {
    case BenchmarkType.WEIGHT:
      // Prefer repMaxes if available (new format)
      if (repMaxes && repMaxes.length > 0) {
        return `${repMaxes.length} rep max${repMaxes.length > 1 ? 'es' : ''}`;
      }
      // Fallback to weightKg for backwards compatibility
      return weightKg !== undefined ? `${weightKg} kg` : 'N/A';
    case BenchmarkType.TIME:
      return timeSeconds !== undefined ? formatTimeSeconds(timeSeconds) : 'N/A';
    case BenchmarkType.REPS:
      return reps !== undefined ? `${reps} reps` : 'N/A';
    case BenchmarkType.OTHER:
      return otherNotes || 'N/A';
    default:
      return 'N/A';
  }
}

/**
 * Converts seconds to MM:SS format
 */
export function formatTimeSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Converts MM:SS format to seconds
 */
export function parseTimeString(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid time format. Use MM:SS');
  }

  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);

  if (isNaN(mins) || isNaN(secs) || secs >= 60 || secs < 0 || mins < 0) {
    throw new Error('Invalid time values. Minutes and seconds must be valid numbers, seconds must be 0-59');
  }

  return mins * 60 + secs;
}

/**
 * Validates a time string in MM:SS format
 */
export function validateTimeString(timeStr: string): boolean {
  try {
    parseTimeString(timeStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse date string from HTML date input to Date object with current time
 * Uses current time instead of midnight to avoid timezone conversion issues
 *
 * When dates are set to midnight (00:00:00) and serialized to UTC, they can
 * shift by one day in negative UTC offset timezones (e.g., PST).
 * Using current time prevents this issue.
 *
 * @param dateString - Date in YYYY-MM-DD format from HTML date input
 * @returns Date object with current time in local timezone
 */
export function parseDateStringToLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);

  // Use current time to avoid timezone shifts when serializing to UTC
  const now = new Date();
  return new Date(
    year,
    month - 1, // Month is 0-indexed in JavaScript
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
}