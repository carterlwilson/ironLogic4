import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { IProgram, CreateProgramRequest, UpdateProgramRequest, ProgramListParams } from '@ironlogic4/shared/types/programs';
import { programApi } from '../services/programApi';

// Query keys
export const programKeys = {
  all: ['programs'] as const,
  lists: () => [...programKeys.all, 'list'] as const,
  list: (params: ProgramListParams) => [...programKeys.lists(), params] as const,
  details: () => [...programKeys.all, 'detail'] as const,
  detail: (id: string) => [...programKeys.details(), id] as const,
};

// List programs hook
export function useProgramList(params: ProgramListParams = {}) {
  return useQuery({
    queryKey: programKeys.list(params),
    queryFn: () => programApi.getPrograms(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get single program hook
export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: programKeys.detail(id!),
    queryFn: () => programApi.getProgram(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Create program mutation
export function useCreateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProgramRequest) => programApi.createProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      notifications.show({
        title: 'Success',
        message: 'Program created successfully',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create program',
        color: 'red',
        autoClose: 5000,
      });
    },
  });
}

// Update program mutation
export function useUpdateProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramRequest }) =>
      programApi.updateProgram(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: programKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      notifications.show({
        title: 'Success',
        message: 'Program updated successfully',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update program',
        color: 'red',
        autoClose: 5000,
      });
    },
  });
}

// Update program structure mutation (for nested changes)
export function useUpdateProgramStructure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, program }: { id: string; program: Partial<IProgram> }) =>
      programApi.updateProgramStructure(id, program),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: programKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      notifications.show({
        title: 'Success',
        message: 'Program saved successfully',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to save program',
        color: 'red',
        autoClose: 5000,
      });
    },
  });
}

// Delete program mutation
export function useDeleteProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => programApi.deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programKeys.lists() });
      notifications.show({
        title: 'Success',
        message: 'Program deleted successfully',
        color: 'green',
        autoClose: 3000,
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete program',
        color: 'red',
        autoClose: 5000,
      });
    },
  });
}