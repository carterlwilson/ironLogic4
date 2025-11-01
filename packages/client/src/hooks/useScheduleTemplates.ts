import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type {
  IScheduleTemplate,
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest,
} from '@ironlogic4/shared';
import { scheduleApi } from '../services/scheduleApi';

interface UseScheduleTemplatesState {
  templates: IScheduleTemplate[];
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedTemplate: IScheduleTemplate | null;
}

interface UseScheduleTemplatesReturn extends UseScheduleTemplatesState {
  loadTemplates: () => Promise<void>;
  createTemplate: (data: CreateScheduleTemplateRequest) => Promise<void>;
  updateTemplate: (id: string, data: UpdateScheduleTemplateRequest) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  openAddModal: () => void;
  openEditModal: (template: IScheduleTemplate) => void;
  openDeleteModal: (template: IScheduleTemplate) => void;
  closeModals: () => void;
  refreshTemplates: () => Promise<void>;
}

const initialState: UseScheduleTemplatesState = {
  templates: [],
  loading: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  selectedTemplate: null,
};

/**
 * Hook for managing schedule templates
 * Handles CRUD operations and modal state for schedule templates
 */
export const useScheduleTemplates = (): UseScheduleTemplatesReturn => {
  const [state, setState] = useState<UseScheduleTemplatesState>(initialState);

  const loadTemplates = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await scheduleApi.getTemplates();
      setState(prev => ({
        ...prev,
        templates: response.data || [],
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load schedule templates';
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

      await loadTemplates();
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
  }, [loadTemplates]);

  const updateTemplate = useCallback(async (id: string, data: UpdateScheduleTemplateRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await scheduleApi.updateTemplate(id, data);

      setState(prev => ({
        ...prev,
        isEditModalOpen: false,
        selectedTemplate: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Schedule template updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadTemplates();
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
  }, [loadTemplates]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await scheduleApi.deleteTemplate(id);

      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        selectedTemplate: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Schedule template deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadTemplates();
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
  }, [loadTemplates]);

  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const openEditModal = useCallback((template: IScheduleTemplate) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedTemplate: template,
    }));
  }, []);

  const openDeleteModal = useCallback((template: IScheduleTemplate) => {
    setState(prev => ({
      ...prev,
      isDeleteModalOpen: true,
      selectedTemplate: template,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      selectedTemplate: null,
    }));
  }, []);

  const refreshTemplates = useCallback(() => {
    return loadTemplates();
  }, [loadTemplates]);

  return {
    ...state,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    refreshTemplates,
  };
};