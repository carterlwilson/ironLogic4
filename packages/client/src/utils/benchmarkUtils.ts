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
 * Get the age of a benchmark in days
 */
export function getBenchmarkAgeInDays(benchmark: ClientBenchmark): number {
  const now = new Date();
  const recordedDate = new Date(benchmark.recordedAt);
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
      return benchmark.weightKg ?? null;
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
    const dateA = new Date(a.recordedAt).getTime();
    const dateB = new Date(b.recordedAt).getTime();
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