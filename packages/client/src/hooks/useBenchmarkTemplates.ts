import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import { benchmarkTemplateApi } from '../services/benchmarkTemplateApi';

interface UseBenchmarkTemplatesReturn {
  templates: BenchmarkTemplate[];
  loading: boolean;
  error: string | null;
  loadTemplates: (gymId?: string) => Promise<void>;
}

export const useBenchmarkTemplates = (gymId?: string): UseBenchmarkTemplatesReturn => {
  const [templates, setTemplates] = useState<BenchmarkTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (providedGymId?: string) => {
    const effectiveGymId = providedGymId || gymId;

    setLoading(true);
    setError(null);

    try {
      const response = await benchmarkTemplateApi.getBenchmarkTemplates({
        gymId: effectiveGymId,
        page: 1,
        limit: 100, // Get all templates
      });

      setTemplates(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load benchmark templates';
      setError(errorMessage);

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (gymId) {
      loadTemplates(gymId);
    }
  }, [gymId, loadTemplates]);

  return {
    templates,
    loading,
    error,
    loadTemplates,
  };
};