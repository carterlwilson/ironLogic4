import { ClientBenchmark, RepMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';

/**
 * Check if a benchmark is editable (less than 1 week old)
 */
export function isBenchmarkEditable(benchmark: ClientBenchmark): boolean {
  if (!benchmark.recordedAt && !benchmark.repMaxes?.[0]?.recordedAt) return false;

  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const recordedDate = benchmark.recordedAt
    ? new Date(benchmark.recordedAt)
    : new Date(benchmark.repMaxes![0].recordedAt);
  const ageMs = now.getTime() - recordedDate.getTime();

  return ageMs < ONE_WEEK_MS;
}

/**
 * Check if a specific repMax is editable (recorded within last 14 days)
 */
export function isRepMaxEditable(repMax: RepMax): boolean {
  const ageInDays = getRepMaxAgeInDays(repMax);
  return ageInDays <= 14;
}

/**
 * Get age of repMax in days
 */
export function getRepMaxAgeInDays(repMax: RepMax): number {
  const recordedDate = new Date(repMax.recordedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - recordedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Sort repMaxes by reps count (1RM, 3RM, 5RM, etc.)
 * Requires template data to get reps count
 */
export function sortRepMaxesByReps(
  repMaxes: RepMax[],
  getTemplateReps: (templateRepMaxId: string) => number | undefined
): RepMax[] {
  return [...repMaxes].sort((a, b) => {
    const aReps = getTemplateReps(a.templateRepMaxId) || 999;
    const bReps = getTemplateReps(b.templateRepMaxId) || 999;
    return aReps - bReps;
  });
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date for input field (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

/**
 * Get the age of a benchmark in days
 */
export function getBenchmarkAgeInDays(benchmark: ClientBenchmark): number {
  const now = new Date();
  const recordedDate = benchmark.recordedAt
    ? new Date(benchmark.recordedAt)
    : benchmark.repMaxes?.[0]
    ? new Date(benchmark.repMaxes[0].recordedAt)
    : now;
  const ageMs = now.getTime() - recordedDate.getTime();
  return Math.floor(ageMs / (24 * 60 * 60 * 1000));
}

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
      if (repMaxes && repMaxes.length > 0) {
        return `${repMaxes.length} rep max${repMaxes.length > 1 ? 'es' : ''}`;
      }
      return weightKg !== undefined ? `${weightKg} kg` : 'No data';
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
 * Get measurement value as a number (for sorting and comparison)
 */
export function getMeasurementValue(benchmark: ClientBenchmark): number | null {
  switch (benchmark.type) {
    case BenchmarkType.WEIGHT:
      // For WEIGHT benchmarks with repMaxes, return the heaviest weight (typically 1RM)
      if (benchmark.repMaxes && benchmark.repMaxes.length > 0) {
        return Math.max(...benchmark.repMaxes.map(rm => rm.weightKg));
      }
      return null;
    case BenchmarkType.TIME:
      return benchmark.timeSeconds ?? null;
    case BenchmarkType.REPS:
      return benchmark.reps ?? null;
    default:
      return null;
  }
}