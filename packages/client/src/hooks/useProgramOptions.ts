import { useMemo } from 'react';
import { useProgramList } from './usePrograms';

interface ProgramOption {
  value: string;
  label: string;
}

/**
 * Hook to get program options for a gym formatted for Mantine Select
 * @param gymId - The gym ID to fetch programs for
 * @returns An array of program options with "No program" as the first option
 */
export function useProgramOptions(gymId: string | undefined) {
  const { data, isLoading, error } = useProgramList(
    gymId ? { gymId, isActive: true } : {}
  );

  const options = useMemo<ProgramOption[]>(() => {
    if (!data?.data) {
      return [{ value: '', label: 'No program' }];
    }

    const programOptions = data.data.map((program) => ({
      value: program.id,
      label: program.name,
    }));

    return [{ value: '', label: 'No program' }, ...programOptions];
  }, [data]);

  return {
    options,
    isLoading,
    error,
  };
}