import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type {
  IActiveSchedule,
  CreateActiveScheduleRequest,
} from '@ironlogic4/shared';
import { scheduleApi } from '../services/scheduleApi';

interface UseActiveScheduleState {
  activeSchedule: IActiveSchedule | null;
  loading: boolean;
  error: string | null;
  isCreateModalOpen: boolean;
  isDetailsModalOpen: boolean;
  isEditCoachesModalOpen: boolean;
  isResetModalOpen: boolean;
  isDeleteModalOpen: boolean;
}

interface UseActiveScheduleReturn extends UseActiveScheduleState {
  loadActiveSchedule: () => Promise<void>;
  createActiveSchedule: (data: CreateActiveScheduleRequest) => Promise<void>;
  updateCoaches: (coachIds: string[]) => Promise<void>;
  resetSchedule: () => Promise<void>;
  deleteActiveSchedule: () => Promise<void>;
  openCreateModal: () => void;
  openDetailsModal: () => void;
  openEditCoachesModal: () => void;
  openResetModal: () => void;
  openDeleteModal: () => void;
  closeModals: () => void;
  refreshActiveSchedule: () => Promise<void>;
}

const initialState: UseActiveScheduleState = {
  activeSchedule: null,
  loading: false,
  error: null,
  isCreateModalOpen: false,
  isDetailsModalOpen: false,
  isEditCoachesModalOpen: false,
  isResetModalOpen: false,
  isDeleteModalOpen: false,
};

/**
 * Hook for managing the active schedule
 * Handles CRUD operations and modal state for the active schedule
 */
export const useActiveSchedule = (): UseActiveScheduleReturn => {
  const [state, setState] = useState<UseActiveScheduleState>(initialState);

  const loadActiveSchedule = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await scheduleApi.getActiveSchedule();
      setState(prev => ({
        ...prev,
        activeSchedule: response.data || null,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load active schedule';
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

  const createActiveSchedule = useCallback(async (data: CreateActiveScheduleRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await scheduleApi.createActiveSchedule(data);

      setState(prev => ({
        ...prev,
        isCreateModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Active schedule created successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadActiveSchedule();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create active schedule';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadActiveSchedule]);

  const updateCoaches = useCallback(async (coachIds: string[]) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await scheduleApi.updateActiveScheduleCoaches(coachIds);

      setState(prev => ({
        ...prev,
        isEditCoachesModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Coaches updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadActiveSchedule();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update coaches';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadActiveSchedule]);

  const resetSchedule = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const response = await scheduleApi.resetActiveSchedule();

      setState(prev => ({
        ...prev,
        isResetModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: response.data?.message || 'Schedule reset successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadActiveSchedule();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset schedule';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadActiveSchedule]);

  const deleteActiveSchedule = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await scheduleApi.deleteActiveSchedule();

      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        activeSchedule: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Active schedule deleted successfully',
        color: 'green',
        autoClose: 3000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete active schedule';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, []);

  const openCreateModal = useCallback(() => {
    setState(prev => ({ ...prev, isCreateModalOpen: true }));
  }, []);

  const openDetailsModal = useCallback(() => {
    setState(prev => ({ ...prev, isDetailsModalOpen: true }));
  }, []);

  const openEditCoachesModal = useCallback(() => {
    setState(prev => ({ ...prev, isEditCoachesModalOpen: true }));
  }, []);

  const openResetModal = useCallback(() => {
    setState(prev => ({ ...prev, isResetModalOpen: true }));
  }, []);

  const openDeleteModal = useCallback(() => {
    setState(prev => ({ ...prev, isDeleteModalOpen: true }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCreateModalOpen: false,
      isDetailsModalOpen: false,
      isEditCoachesModalOpen: false,
      isResetModalOpen: false,
      isDeleteModalOpen: false,
    }));
  }, []);

  const refreshActiveSchedule = useCallback(() => {
    return loadActiveSchedule();
  }, [loadActiveSchedule]);

  return {
    ...state,
    loadActiveSchedule,
    createActiveSchedule,
    updateCoaches,
    resetSchedule,
    deleteActiveSchedule,
    openCreateModal,
    openDetailsModal,
    openEditCoachesModal,
    openResetModal,
    openDeleteModal,
    closeModals,
    refreshActiveSchedule,
  };
};