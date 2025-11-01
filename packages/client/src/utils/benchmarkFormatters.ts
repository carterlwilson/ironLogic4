import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';

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