import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { programApi } from '../services/programApi';
import { programKeys } from './usePrograms';

// Get program progress hook
export function useGetProgramProgress(programId: string | undefined) {
  return useQuery({
    queryKey: [...programKeys.detail(programId!), 'progress'],
    queryFn: () => programApi.getCurrentProgress(programId!),
    enabled: !!programId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Update program progress mutation
export function useUpdateProgramProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ programId, blockIndex, weekIndex }: { programId: string; blockIndex: number; weekIndex: number }) =>
      programApi.updateProgress(programId, blockIndex, weekIndex),
    onSuccess: (_, variables) => {
      // Invalidate both the program detail and progress queries to refresh all data
      queryClient.invalidateQueries({ queryKey: programKeys.detail(variables.programId) });
      queryClient.invalidateQueries({ queryKey: [...programKeys.detail(variables.programId), 'progress'] });
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });

      notifications.show({
        title: 'Success',
        message: 'Program position updated successfully',
        color: 'forestGreen',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update program position',
        color: 'red',
        autoClose: 5000,
      });
    },
  });
}