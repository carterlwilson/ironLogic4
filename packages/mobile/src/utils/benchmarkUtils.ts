import { ClientBenchmark, RepMax, TimeSubMax, DistanceSubMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { BenchmarkType, BenchmarkTemplate, DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';

/**
 * Check if a benchmark is editable (less than or equal to 14 days old)
 */
export function isBenchmarkEditable(benchmark: ClientBenchmark): boolean {
  // Get the most recent recordedAt date from the benchmark
  let recordedDate: Date | null = null;

  if (benchmark.recordedAt) {
    recordedDate = new Date(benchmark.recordedAt);
  } else if (benchmark.repMaxes?.[0]?.recordedAt) {
    recordedDate = new Date(benchmark.repMaxes[0].recordedAt);
  } else if (benchmark.timeSubMaxes?.[0]?.recordedAt) {
    recordedDate = new Date(benchmark.timeSubMaxes[0].recordedAt);
  } else if (benchmark.distanceSubMaxes?.[0]?.recordedAt) {
    recordedDate = new Date(benchmark.distanceSubMaxes[0].recordedAt);
  }

  if (!recordedDate) return false;

  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const ageMs = now.getTime() - recordedDate.getTime();

  return ageMs <= TWO_WEEKS_MS;
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
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
 * Extracts date from ISO string to avoid timezone conversion issues
 */
export function formatDate(date: Date | string): string {
  let dateStr: string;

  if (typeof date === 'string') {
    // ISO string: extract YYYY-MM-DD portion (e.g., "2024-12-29T11:19:00.000Z" → "2024-12-29")
    dateStr = date.split('T')[0];
  } else {
    // Date object: format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }

  // Parse YYYY-MM-DD and format (avoids timezone conversion)
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date for HTML date input (YYYY-MM-DD)
 * Extracts date from ISO string to avoid timezone conversion issues
 */
export function formatDateForInput(date: Date | string): string {
  if (typeof date === 'string') {
    // ISO string: extract YYYY-MM-DD portion (already in correct format)
    return date.split('T')[0];
  }

  // Date object: format to YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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

  // Get the most recent recordedAt date from the benchmark
  let recordedDate: Date;

  if (benchmark.recordedAt) {
    recordedDate = new Date(benchmark.recordedAt);
  } else if (benchmark.repMaxes?.[0]?.recordedAt) {
    recordedDate = new Date(benchmark.repMaxes[0].recordedAt);
  } else if (benchmark.timeSubMaxes?.[0]?.recordedAt) {
    recordedDate = new Date(benchmark.timeSubMaxes[0].recordedAt);
  } else if (benchmark.distanceSubMaxes?.[0]?.recordedAt) {
    recordedDate = new Date(benchmark.distanceSubMaxes[0].recordedAt);
  } else {
    recordedDate = now;  // Fallback for benchmarks with no dates
  }

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
  repMaxes?: RepMax[],
  timeSubMaxes?: TimeSubMax[],
  distanceSubMaxes?: DistanceSubMax[]
): string {
  switch (type) {
    case BenchmarkType.WEIGHT:
      if (repMaxes && repMaxes.length > 0) {
        return `${repMaxes.length} rep max${repMaxes.length > 1 ? 'es' : ''}`;
      }
      return weightKg !== undefined ? `${weightKg} kg` : 'No data';
    case BenchmarkType.DISTANCE:
      if (timeSubMaxes && timeSubMaxes.length > 0) {
        return `${timeSubMaxes.length} time interval${timeSubMaxes.length > 1 ? 's' : ''}`;
      }
      return 'No data';
    case BenchmarkType.TIME:
      if (distanceSubMaxes && distanceSubMaxes.length > 0) {
        return `${distanceSubMaxes.length} distance interval${distanceSubMaxes.length > 1 ? 's' : ''}`;
      }
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
    case BenchmarkType.DISTANCE:
      // For DISTANCE benchmarks with timeSubMaxes, return the longest distance
      if (benchmark.timeSubMaxes && benchmark.timeSubMaxes.length > 0) {
        return Math.max(...benchmark.timeSubMaxes.map(tsm => tsm.distanceMeters));
      }
      return null;
    case BenchmarkType.TIME:
      // For TIME benchmarks with distanceSubMaxes, return the fastest time
      if (benchmark.distanceSubMaxes && benchmark.distanceSubMaxes.length > 0) {
        return Math.min(...benchmark.distanceSubMaxes.map(dsm => dsm.timeSeconds));
      }
      return benchmark.timeSeconds ?? null;
    case BenchmarkType.REPS:
      return benchmark.reps ?? null;
    default:
      return null;
  }
}

/**
 * Convert distance for display based on unit preference
 */
export function formatDistance(
  distanceMeters: number,
  displayUnit: DistanceUnit
): { value: string; unit: string } {
  if (displayUnit === DistanceUnit.KILOMETERS) {
    return {
      value: (distanceMeters / 1000).toFixed(2),
      unit: 'km'
    };
  }
  return {
    value: distanceMeters.toFixed(0),
    unit: 'm'
  };
}

/**
 * Convert distance input to meters for storage
 */
export function convertDistanceToMeters(
  value: number,
  inputUnit: DistanceUnit
): number {
  return inputUnit === DistanceUnit.KILOMETERS ? value * 1000 : value;
}

/**
 * Get longest distance from timeSubMaxes array
 */
export function getLongestDistance(
  timeSubMaxes: TimeSubMax[]
): number | null {
  if (!timeSubMaxes || timeSubMaxes.length === 0) return null;
  return Math.max(...timeSubMaxes.map(tsm => tsm.distanceMeters));
}

/**
 * Get fastest time from distanceSubMaxes array
 */
export function getFastestTime(
  distanceSubMaxes: DistanceSubMax[]
): number | null {
  if (!distanceSubMaxes || distanceSubMaxes.length === 0) return null;
  return Math.min(...distanceSubMaxes.map(dsm => dsm.timeSeconds));
}

/**
 * Format time sub-maxes for display with proper units
 */
export function formatTimeSubMaxes(
  timeSubMaxes: TimeSubMax[],
  template: BenchmarkTemplate
): Array<{ name: string; distance: string; unit: string; distanceMeters: number }> {
  if (!template.templateTimeSubMaxes) return [];

  return timeSubMaxes.map(tsm => {
    const templateTsm = template.templateTimeSubMaxes?.find(
      t => t.id === tsm.templateSubMaxId
    );
    const { value, unit } = formatDistance(
      tsm.distanceMeters,
      template.distanceUnit!
    );
    return {
      name: templateTsm?.name || 'Unknown',
      distance: value,
      unit,
      distanceMeters: tsm.distanceMeters
    };
  });
}

/**
 * Format distance sub-maxes for TIME benchmarks
 */
export function formatDistanceSubMaxes(
  distanceSubMaxes: DistanceSubMax[],
  template: BenchmarkTemplate
): Array<{ name: string; time: string }> {
  if (!template.templateDistanceSubMaxes) return [];

  return distanceSubMaxes.map(dsm => {
    const templateDsm = template.templateDistanceSubMaxes?.find(
      t => t.id === dsm.templateDistanceSubMaxId
    );
    return {
      name: templateDsm?.name || 'Unknown',
      time: formatTimeSeconds(dsm.timeSeconds)
    };
  });
}

/**
 * Check if a timeSubMax is editable (less than or equal to 14 days old)
 */
export function isTimeSubMaxEditable(timeSubMax: TimeSubMax): boolean {
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const recordedDate = new Date(timeSubMax.recordedAt);
  const ageMs = now.getTime() - recordedDate.getTime();
  return ageMs <= TWO_WEEKS_MS;
}

/**
 * Check if a distanceSubMax is editable (less than or equal to 14 days old)
 */
export function isDistanceSubMaxEditable(distanceSubMax: DistanceSubMax): boolean {
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const recordedDate = new Date(distanceSubMax.recordedAt);
  const ageMs = now.getTime() - recordedDate.getTime();
  return ageMs <= TWO_WEEKS_MS;
}

/**
 * Get age of a timeSubMax in days
 */
export function getTimeSubMaxAgeInDays(timeSubMax: TimeSubMax): number {
  const recordedDate = new Date(timeSubMax.recordedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - recordedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get age of a distanceSubMax in days
 */
export function getDistanceSubMaxAgeInDays(distanceSubMax: DistanceSubMax): number {
  const recordedDate = new Date(distanceSubMax.recordedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - recordedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}