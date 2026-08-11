import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type {
  IScheduleTemplate,
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest,
} from '@ironlogic4/shared';
import { scheduleApi } from '../services/scheduleApi';

interface UseScheduleTemplatesState {
  template: IScheduleTemplate | null;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isDeleteModalOpen: boolean;
}

interface UseScheduleTemplatesReturn extends UseScheduleTemplatesState {
  loadTemplate: () => Promise<void>;
  createTemplate: (data: CreateScheduleTemplateRequest) => Promise<void>;
  updateTemplate: (id: string, data: UpdateScheduleTemplateRequest) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  openAddModal: () => void;
  openDeleteModal: () => void;
  closeModals: () => void;
  refreshTemplate: () => Promise<void>;
}

const initialState: UseScheduleTemplatesState = {
  template: null,
  loading: false,
  error: null,
  isAddModalOpen: false,
  isDeleteModalOpen: false,
};

/**
 * Hook for managing the gym's single schedule template
 * Handles CRUD operations and modal state for the schedule template
 */
export const useScheduleTemplates = (): UseScheduleTemplatesReturn => {
  const [state, setState] = useState<UseScheduleTemplatesState>(initialState);

  const loadTemplate = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await scheduleApi.getTemplates();
      setState(prev => ({
        ...prev,
        template: response.data?.[0] ?? null,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load schedule template';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, []);

  const createTemplate = useCallback(async (data: CreateScheduleTemplateRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await scheduleApi.createTemplate(data);

      setState(prev => ({
        ...prev,
        isAddModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Schedule template created successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadTemplate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create schedule template';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadTemplate]);

  const updateTemplate = useCallback(async (id: string, data: UpdateScheduleTemplateRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await scheduleApi.updateTemplate(id, data);

      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Success',
        message: 'Schedule template updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadTemplate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update schedule template';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadTemplate]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await scheduleApi.deleteTemplate(id);

      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        template: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Schedule template deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadTemplate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete schedule template';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadTemplate]);

  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const openDeleteModal = useCallback(() => {
    setState(prev => ({ ...prev, isDeleteModalOpen: true }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAddModalOpen: false,
      isDeleteModalOpen: false,
    }));
  }, []);

  const refreshTemplate = useCallback(() => {
    return loadTemplate();
  }, [loadTemplate]);

  return {
    ...state,
    loadTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    openAddModal,
    openDeleteModal,
    closeModals,
    refreshTemplate,
  };
};
