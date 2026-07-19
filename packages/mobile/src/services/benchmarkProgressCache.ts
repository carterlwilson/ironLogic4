interface ChartCacheEntry {
  chartData: Array<Record<string, any>>;
  series: Array<{ name: string; label: string }>;
  unit: string;
}

const cache = new Map<string, ChartCacheEntry>();

export function getCachedProgress(templateId: string): ChartCacheEntry | undefined {
  return cache.get(templateId);
}

export function setCachedProgress(templateId: string, entry: ChartCacheEntry): void {
  cache.set(templateId, entry);
}

export function clearProgressCache(): void {
  cache.clear();
}
