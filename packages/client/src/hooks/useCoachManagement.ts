import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type {
  CoachResponse,
  CoachListParams,
  CreateCoachRequest,
  UpdateCoachRequest,
  ResetCoachPasswordRequest,
} from '@ironlogic4/shared/types/coaches';
import { coachApi } from '../services/coachApi';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseCoachManagementState {
  // Data
  coaches: CoachResponse[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;

  // UI State
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isResetPasswordModalOpen: boolean;
  isPasswordDisplayModalOpen: boolean;
  selectedCoach: CoachResponse | null;
  temporaryPassword: string | null;
}

interface UseCoachManagementReturn extends UseCoachManagementState {
  // Actions
  loadCoaches: (params?: CoachListParams) => Promise<void>;
  createCoach: (data: CreateCoachRequest) => Promise<void>;
  updateCoach: (id: string, data: UpdateCoachRequest) => Promise<void>;
  deleteCoach: (id: string) => Promise<void>;
  resetPassword: (id: string, data: ResetCoachPasswordRequest) => Promise<void>;

  // Modal Controls
  openAddModal: () => void;
  openEditModal: (coach: CoachResponse) => void;
  openDeleteModal: (coach: CoachResponse) => void;
  openResetPasswordModal: (coach: CoachResponse) => void;
  closeModals: () => void;
  closePasswordDisplayModal: () => void;

  // Utility
  refreshCoaches: () => Promise<void>;
}

const initialState: UseCoachManagementState = {
  coaches: [],
  pagination: null,
  loading: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isResetPasswordModalOpen: false,
  isPasswordDisplayModalOpen: false,
  selectedCoach: null,
  temporaryPassword: null,
};

export const useCoachManagement = (): UseCoachManagementReturn => {
  const [state, setState] = useState<UseCoachManagementState>(initialState);
  const [lastParams, setLastParams] = useState<CoachListParams>({ page: 1, limit: 10 });

  const loadCoaches = useCallback(async (params: CoachListParams = { page: 1, limit: 10 }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastParams(params);

    try {
      const response = await coachApi.getCoaches(params);

      setState(prev => ({
        ...prev,
        coaches: response.data || [],
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load coaches';
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

  const createCoach = useCallback(async (data: CreateCoachRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const response = await coachApi.createCoach(data);

      // Close modal
      setState(prev => ({
        ...prev,
        isAddModalOpen: false,
        loading: false,
      }));

      // Check if temporary password was returned
      if (response.data?.temporaryPassword) {
        setState(prev => ({
          ...prev,
          temporaryPassword: response.data?.temporaryPassword || null,
          isPasswordDisplayModalOpen: true,
        }));
      } else {
        notifications.show({
          title: 'Success',
          message: 'Coach created successfully',
          color: 'green',
          autoClose: 3000,
        });
      }

      // Refresh the coach list
      await loadCoaches(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create coach';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadCoaches, lastParams]);

  const updateCoach = useCallback(async (id: string, data: UpdateCoachRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await coachApi.updateCoach(id, data);

      // Close modal and refresh coaches
      setState(prev => ({
        ...prev,
        isEditModalOpen: false,
        selectedCoach: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Coach updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the coach list
      await loadCoaches(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update coach';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadCoaches, lastParams]);

  const deleteCoach = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await coachApi.deleteCoach(id);

      // Close modal and refresh coaches
      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        selectedCoach: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Coach deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the coach list
      await loadCoaches(lastParams);
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false }));

      // Don't close modal if there's a dependency error (409)
      // The error details will be displayed in the modal
      if (error.status !== 409) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete coach';
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          autoClose: 5000,
        });
      }

      // Re-throw to allow modal to handle it
      throw error;
    }
  }, [loadCoaches, lastParams]);

  const resetPassword = useCallback(async (id: string, data: ResetCoachPasswordRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const response = await coachApi.resetPassword(id, data);

      // Close modal
      setState(prev => ({
        ...prev,
        isResetPasswordModalOpen: false,
        selectedCoach: null,
        loading: false,
      }));

      // Check if temporary password was returned
      if (response.data?.temporaryPassword) {
        setState(prev => ({
          ...prev,
          temporaryPassword: response.data?.temporaryPassword || null,
          isPasswordDisplayModalOpen: true,
        }));
      } else {
        notifications.show({
          title: 'Success',
          message: response.data?.message || 'Password reset successfully',
          color: 'green',
          autoClose: 3000,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, []);

  // Modal Controls
  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const openEditModal = useCallback((coach: CoachResponse) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedCoach: coach,
    }));
  }, []);

  const openDeleteModal = useCallback((coach: CoachResponse) => {
    setState(prev => ({
      ...prev,
      isDeleteModalOpen: true,
      selectedCoach: coach,
    }));
  }, []);

  const openResetPasswordModal = useCallback((coach: CoachResponse) => {
    setState(prev => ({
      ...prev,
      isResetPasswordModalOpen: true,
      selectedCoach: coach,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      isResetPasswordModalOpen: false,
      selectedCoach: null,
    }));
  }, []);

  const closePasswordDisplayModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPasswordDisplayModalOpen: false,
      temporaryPassword: null,
    }));
  }, []);

  const refreshCoaches = useCallback(() => {
    return loadCoaches(lastParams);
  }, [loadCoaches, lastParams]);

  return {
    ...state,
    loadCoaches,
    createCoach,
    updateCoach,
    deleteCoach,
    resetPassword,
    openAddModal,
    openEditModal,
    openDeleteModal,
    openResetPasswordModal,
    closeModals,
    closePasswordDisplayModal,
    refreshCoaches,
  };
};