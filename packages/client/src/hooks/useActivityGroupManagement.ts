import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { ActivityGroup, ActivityGroupListParams } from '@ironlogic4/shared/types/activityGroups';
import { activityGroupApi, CreateActivityGroupRequest, UpdateActivityGroupRequest } from '../services/activityGroupApi';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseActivityGroupManagementState {
  // Data
  activityGroups: ActivityGroup[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;

  // UI State
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedActivityGroup: ActivityGroup | null;
}

interface UseActivityGroupManagementReturn extends UseActivityGroupManagementState {
  // Actions
  loadActivityGroups: (params?: ActivityGroupListParams) => Promise<void>;
  createActivityGroup: (data: CreateActivityGroupRequest) => Promise<void>;
  updateActivityGroup: (id: string, data: UpdateActivityGroupRequest) => Promise<void>;
  deleteActivityGroup: (id: string) => Promise<void>;

  // Modal Controls
  openAddModal: () => void;
  openEditModal: (group: ActivityGroup) => void;
  openDeleteModal: (group: ActivityGroup) => void;
  closeModals: () => void;

  // Utility
  refreshActivityGroups: () => Promise<void>;
}

const initialState: UseActivityGroupManagementState = {
  activityGroups: [],
  pagination: null,
  loading: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  selectedActivityGroup: null,
};

export const useActivityGroupManagement = (): UseActivityGroupManagementReturn => {
  const [state, setState] = useState<UseActivityGroupManagementState>(initialState);
  const [lastParams, setLastParams] = useState<ActivityGroupListParams>({ page: 1, limit: 10 });

  const loadActivityGroups = useCallback(async (params: ActivityGroupListParams = { page: 1, limit: 10 }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastParams(params);

    try {
      const response = await activityGroupApi.getActivityGroups(params);

      setState(prev => ({
        ...prev,
        activityGroups: response.data || [],
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load activity groups';
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

  const createActivityGroup = useCallback(async (data: CreateActivityGroupRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await activityGroupApi.createActivityGroup(data);

      // Close modal and refresh groups
      setState(prev => ({
        ...prev,
        isAddModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Activity group created successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the activity group list
      await loadActivityGroups(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create activity group';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadActivityGroups, lastParams]);

  const updateActivityGroup = useCallback(async (id: string, data: UpdateActivityGroupRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await activityGroupApi.updateActivityGroup(id, data);

      // Close modal and refresh groups
      setState(prev => ({
        ...prev,
        isEditModalOpen: false,
        selectedActivityGroup: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Activity group updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the activity group list
      await loadActivityGroups(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update activity group';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadActivityGroups, lastParams]);

  const deleteActivityGroup = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await activityGroupApi.deleteActivityGroup(id);

      // Close modal and refresh groups
      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        selectedActivityGroup: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Activity group deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the activity group list
      await loadActivityGroups(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete activity group';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadActivityGroups, lastParams]);

  // Modal Controls
  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const openEditModal = useCallback((group: ActivityGroup) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedActivityGroup: group,
    }));
  }, []);

  const openDeleteModal = useCallback((group: ActivityGroup) => {
    setState(prev => ({
      ...prev,
      isDeleteModalOpen: true,
      selectedActivityGroup: group,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      selectedActivityGroup: null,
    }));
  }, []);

  const refreshActivityGroups = useCallback(() => {
    return loadActivityGroups(lastParams);
  }, [loadActivityGroups, lastParams]);

  return {
    ...state,
    loadActivityGroups,
    createActivityGroup,
    updateActivityGroup,
    deleteActivityGroup,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    refreshActivityGroups,
  };
};