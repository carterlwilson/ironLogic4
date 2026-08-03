import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { IActiveSchedule } from '@ironlogic4/shared';
import { scheduleApi } from '../services/scheduleApi';

interface UseActiveScheduleState {
  activeSchedule: IActiveSchedule | null;
  loading: boolean;
  error: string | null;
  isCreateModalOpen: boolean;
  isDetailsModalOpen: boolean;
  isResetModalOpen: boolean;
  isDeleteModalOpen: boolean;
}

interface UseActiveScheduleReturn extends UseActiveScheduleState {
  loadActiveSchedule: () => Promise<void>;
  createActiveSchedule: () => Promise<void>;
  updateTimeslot: (timeslotId: string, data: { coachIds: string[]; location: string }) => Promise<void>;
  resetSchedule: () => Promise<void>;
  deleteActiveSchedule: () => Promise<void>;
  openCreateModal: () => void;
  openDetailsModal: () => void;
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

  const createActiveSchedule = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await scheduleApi.createActiveSchedule();

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

  const updateTimeslot = useCallback(async (timeslotId: string, data: { coachIds: string[]; location: string }) => {
    const scheduleId = state.activeSchedule?.id;
    if (!scheduleId) return;

    try {
      const response = await scheduleApi.updateTimeslot(scheduleId, timeslotId, data);

      setState(prev => ({
        ...prev,
        activeSchedule: response.data || prev.activeSchedule,
      }));

      notifications.show({
        title: 'Success',
        message: 'Timeslot updated successfully',
        color: 'green',
        autoClose: 3000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update timeslot';

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [state.activeSchedule?.id]);

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
    updateTimeslot,
    resetSchedule,
    deleteActiveSchedule,
    openCreateModal,
    openDetailsModal,
    openResetModal,
    openDeleteModal,
    closeModals,
    refreshActiveSchedule,
  };
};