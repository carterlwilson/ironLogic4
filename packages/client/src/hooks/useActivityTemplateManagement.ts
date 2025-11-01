import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { ActivityTemplate, CreateActivityTemplateRequest, UpdateActivityTemplateRequest, ActivityTemplateListParams } from '@ironlogic4/shared/types/activityTemplates';
import { activityTemplateApi } from '../services/activityTemplateApi';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseActivityTemplateManagementState {
  // Data
  activityTemplates: ActivityTemplate[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;

  // UI State
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedActivityTemplate: ActivityTemplate | null;
}

interface UseActivityTemplateManagementReturn extends UseActivityTemplateManagementState {
  // Actions
  loadActivityTemplates: (params?: ActivityTemplateListParams) => Promise<void>;
  createActivityTemplate: (data: CreateActivityTemplateRequest) => Promise<void>;
  updateActivityTemplate: (id: string, data: UpdateActivityTemplateRequest) => Promise<void>;
  deleteActivityTemplate: (id: string) => Promise<void>;

  // Modal Controls
  openAddModal: () => void;
  openEditModal: (template: ActivityTemplate) => void;
  openDeleteModal: (template: ActivityTemplate) => void;
  closeModals: () => void;

  // Utility
  refreshActivityTemplates: () => Promise<void>;
}

const initialState: UseActivityTemplateManagementState = {
  activityTemplates: [],
  pagination: null,
  loading: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  selectedActivityTemplate: null,
};

export const useActivityTemplateManagement = (): UseActivityTemplateManagementReturn => {
  const [state, setState] = useState<UseActivityTemplateManagementState>(initialState);
  const [lastParams, setLastParams] = useState<ActivityTemplateListParams>({});

  const loadActivityTemplates = useCallback(async (params: ActivityTemplateListParams = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastParams(params);

    try {
      const response = await activityTemplateApi.getActivityTemplates(params);

      setState(prev => ({
        ...prev,
        activityTemplates: response.data || [],
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load activity templates';
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

  const createActivityTemplate = useCallback(async (data: CreateActivityTemplateRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await activityTemplateApi.createActivityTemplate(data);

      // Close modal and refresh templates
      setState(prev => ({
        ...prev,
        isAddModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Activity template created successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the activity template list
      await loadActivityTemplates(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create activity template';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadActivityTemplates, lastParams]);

  const updateActivityTemplate = useCallback(async (id: string, data: UpdateActivityTemplateRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await activityTemplateApi.updateActivityTemplate(id, data);

      // Close modal and refresh templates
      setState(prev => ({
        ...prev,
        isEditModalOpen: false,
        selectedActivityTemplate: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Activity template updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the activity template list
      await loadActivityTemplates(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update activity template';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadActivityTemplates, lastParams]);

  const deleteActivityTemplate = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await activityTemplateApi.deleteActivityTemplate(id);

      // Close modal and refresh templates
      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        selectedActivityTemplate: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Activity template deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the activity template list
      await loadActivityTemplates(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete activity template';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadActivityTemplates, lastParams]);

  // Modal Controls
  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const openEditModal = useCallback((template: ActivityTemplate) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedActivityTemplate: template,
    }));
  }, []);

  const openDeleteModal = useCallback((template: ActivityTemplate) => {
    setState(prev => ({
      ...prev,
      isDeleteModalOpen: true,
      selectedActivityTemplate: template,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      selectedActivityTemplate: null,
    }));
  }, []);

  const refreshActivityTemplates = useCallback(() => {
    return loadActivityTemplates(lastParams);
  }, [loadActivityTemplates, lastParams]);

  return {
    ...state,
    loadActivityTemplates,
    createActivityTemplate,
    updateActivityTemplate,
    deleteActivityTemplate,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    refreshActivityTemplates,
  };
};