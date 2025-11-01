import { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';

/**
 * Check if a benchmark is editable (less than 1 week old)
 */
export function isBenchmarkEditable(benchmark: ClientBenchmark): boolean {
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const recordedDate = new Date(benchmark.recordedAt);
  const ageMs = now.getTime() - recordedDate.getTime();

  return ageMs < ONE_WEEK_MS;
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
 * Get the age of a benchmark in days
 */
export function getBenchmarkAgeInDays(benchmark: ClientBenchmark): number {
  const now = new Date();
  const recordedDate = new Date(benchmark.recordedAt);
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
  otherNotes?: string
): string {
  switch (type) {
    case BenchmarkType.WEIGHT:
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
 * Get measurement value as a number (for sorting and comparison)
 */
export function getMeasurementValue(benchmark: ClientBenchmark): number | null {
  switch (benchmark.type) {
    case BenchmarkType.WEIGHT:
      return benchmark.weightKg ?? null;
    case BenchmarkType.TIME:
      return benchmark.timeSeconds ?? null;
    case BenchmarkType.REPS:
      return benchmark.reps ?? null;
    default:
      return null;
  }
}