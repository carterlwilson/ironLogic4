import { useQuery } from '@tanstack/react-query';
import { activityTemplateApi } from '../services/activityTemplateApi';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';

interface UseActivityTemplateMapReturn {
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  isLoading: boolean;
  error: Error | null;
}

export function useActivityTemplateMap(gymId: string | undefined): UseActivityTemplateMapReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['activityTemplates', gymId],
    queryFn: () => activityTemplateApi.getActivityTemplates({ gymId: gymId!, limit: 100 }),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
    select: (response) => {
      const templates = response.data || [];
      const templateMap = templates.reduce((acc, t) => {
        acc[t.id] = t;
        return acc;
      }, {} as Record<string, ActivityTemplate>);
      return { templates, templateMap };
    },
  });

  return { templateMap: data?.templateMap ?? {}, templates: data?.templates ?? [], isLoading, error: error as Error | null };
}
