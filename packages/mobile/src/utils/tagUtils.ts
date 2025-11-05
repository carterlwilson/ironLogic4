import { ClientBenchmark } from '@ironlogic4/shared';

/**
 * Extracts all unique tags from an array of benchmarks.
 * Tags are trimmed, deduplicated, and sorted alphabetically.
 *
 * @param benchmarks - Array of benchmarks to extract tags from
 * @returns Sorted array of unique tag strings
 */
export function getAllUniqueTags(benchmarks: ClientBenchmark[]): string[] {
  const tagSet = new Set<string>();

  benchmarks.forEach((benchmark) => {
    benchmark.tags.forEach((tag) => {
      const trimmedTag = tag.trim();
      if (trimmedTag) {
        tagSet.add(trimmedTag);
      }
    });
  });

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
}

/**
 * Filters benchmarks by a selected tag.
 * If selectedTag is null, returns all benchmarks.
 *
 * @param benchmarks - Array of benchmarks to filter
 * @param selectedTag - Tag to filter by, or null to show all
 * @returns Filtered array of benchmarks
 */
export function filterBenchmarksByTag(
  benchmarks: ClientBenchmark[],
  selectedTag: string | null
): ClientBenchmark[] {
  if (selectedTag === null) {
    return benchmarks;
  }

  return benchmarks.filter((benchmark) =>
    benchmark.tags.some((tag) => tag.trim() === selectedTag)
  );
}
