import { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { BenchmarkType, DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';

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
 * Format a date with time for display
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
 * Get age of a repMax in days
 */
export function getRepMaxAgeInDays(repMax: { recordedAt: Date | string }): number {
  const recordedDate = new Date(repMax.recordedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - recordedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
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
 * Determine the measurement type from a benchmark
 */
export function getMeasurementType(benchmark: ClientBenchmark): BenchmarkType {
  return benchmark.type;
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

/**
 * Sort benchmarks by date (newest first)
 */
export function sortBenchmarksByDate(benchmarks: ClientBenchmark[], ascending = false): ClientBenchmark[] {
  return [...benchmarks].sort((a, b) => {
    const dateA = a.recordedAt ? new Date(a.recordedAt).getTime() :
                   a.repMaxes?.[0] ? new Date(a.repMaxes[0].recordedAt).getTime() : 0;
    const dateB = b.recordedAt ? new Date(b.recordedAt).getTime() :
                   b.repMaxes?.[0] ? new Date(b.repMaxes[0].recordedAt).getTime() : 0;
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Sort benchmarks by name (alphabetically)
 */
export function sortBenchmarksByName(benchmarks: ClientBenchmark[], ascending = true): ClientBenchmark[] {
  return [...benchmarks].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (ascending) {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
}

/**
 * Sort benchmarks by type
 */
export function sortBenchmarksByType(benchmarks: ClientBenchmark[], ascending = true): ClientBenchmark[] {
  const typeOrder = [BenchmarkType.WEIGHT, BenchmarkType.TIME, BenchmarkType.REPS, BenchmarkType.OTHER];

  return [...benchmarks].sort((a, b) => {
    const indexA = typeOrder.indexOf(a.type);
    const indexB = typeOrder.indexOf(b.type);
    return ascending ? indexA - indexB : indexB - indexA;
  });
}

/**
 * Filter benchmarks by search term (searches name and tags)
 */
export function filterBenchmarksBySearch(benchmarks: ClientBenchmark[], searchTerm: string): ClientBenchmark[] {
  if (!searchTerm.trim()) {
    return benchmarks;
  }

  const lowercaseSearch = searchTerm.toLowerCase();
  return benchmarks.filter(benchmark => {
    const nameMatch = benchmark.name.toLowerCase().includes(lowercaseSearch);
    const tagsMatch = benchmark.tags.some(tag => tag.toLowerCase().includes(lowercaseSearch));
    return nameMatch || tagsMatch;
  });
}

/**
 * Filter benchmarks by tags (must have ALL selected tags)
 */
export function filterBenchmarksByTags(benchmarks: ClientBenchmark[], selectedTags: string[]): ClientBenchmark[] {
  if (selectedTags.length === 0) {
    return benchmarks;
  }

  return benchmarks.filter(benchmark =>
    selectedTags.every(selectedTag =>
      benchmark.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
    )
  );
}

/**
 * Get all unique tags from a list of benchmarks
 */
export function getAllUniqueTags(benchmarks: ClientBenchmark[]): string[] {
  const tagsSet = new Set<string>();
  benchmarks.forEach(benchmark => {
    benchmark.tags.forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
}

/**
 * Convert distance to meters based on input unit
 */
export function convertDistanceToMeters(
  value: number,
  inputUnit: DistanceUnit
): number {
  return inputUnit === DistanceUnit.KILOMETERS ? value * 1000 : value;
}