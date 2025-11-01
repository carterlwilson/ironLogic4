import { useState, useEffect } from 'react';
import { activityTemplateApi } from '../services/activityTemplateApi';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';

interface UseActivityTemplateMapReturn {
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  isLoading: boolean;
  error: Error | null;
}

export function useActivityTemplateMap(gymId: string | undefined): UseActivityTemplateMapReturn {
  const [templateMap, setTemplateMap] = useState<Record<string, ActivityTemplate>>({});
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gymId) {
      setTemplateMap({});
      setTemplates([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    activityTemplateApi.getActivityTemplates({ gymId, limit: 100 })
      .then(response => {
        const templatesArray = response.data || [];
        setTemplates(templatesArray);

        // Create dictionary for quick lookup
        const map = templatesArray.reduce((acc, template) => {
          acc[template.id] = template;
          return acc;
        }, {} as Record<string, ActivityTemplate>);

        setTemplateMap(map);
      })
      .catch(err => {
        console.error('Failed to load activity templates:', err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [gymId]);

  return { templateMap, templates, isLoading, error };
}