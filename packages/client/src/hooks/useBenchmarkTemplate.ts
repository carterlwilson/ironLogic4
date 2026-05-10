import { useQuery } from '@tanstack/react-query';
import { getBenchmarkTemplate } from '../services/benchmarkApi';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';

export function useBenchmarkTemplate(templateId: string | null | undefined) {
  return useQuery<{ success: true; data: BenchmarkTemplate }, Error, BenchmarkTemplate>({
    queryKey: ['benchmarkTemplate', templateId],
    queryFn: () => getBenchmarkTemplate(templateId!),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data,
  });
}
