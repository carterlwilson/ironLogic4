import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { Gym, CreateGymRequest, UpdateGymRequest, GymListParams } from '@ironlogic4/shared/types/gyms';
import { gymApi } from '../services/gymApi';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseGymManagementState {
  // Data
  gyms: Gym[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;

  // UI State
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedGym: Gym | null;
}

interface UseGymManagementReturn extends UseGymManagementState {
  // Actions
  loadGyms: (params?: GymListParams) => Promise<void>;
  createGym: (data: CreateGymRequest) => Promise<void>;
  updateGym: (id: string, data: UpdateGymRequest) => Promise<void>;
  deleteGym: (id: string) => Promise<void>;

  // Modal Controls
  openAddModal: () => void;
  openEditModal: (gym: Gym) => void;
  openDeleteModal: (gym: Gym) => void;
  closeModals: () => void;

  // Utility
  refreshGyms: () => Promise<void>;
}

const initialState: UseGymManagementState = {
  gyms: [],
  pagination: null,
  loading: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  selectedGym: null,
};

export const useGymManagement = (): UseGymManagementReturn => {
  const [state, setState] = useState<UseGymManagementState>(initialState);
  const [lastParams, setLastParams] = useState<GymListParams>({});

  const loadGyms = useCallback(async (params: GymListParams = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastParams(params);

    try {
      const response = await gymApi.getGyms(params);

      setState(prev => ({
        ...prev,
        gyms: response.data || [],
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load gyms';
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

  const createGym = useCallback(async (data: CreateGymRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await gymApi.createGym(data);

      // Close modal and refresh gyms
      setState(prev => ({
        ...prev,
        isAddModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Gym created successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the gym list
      await loadGyms(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create gym';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadGyms, lastParams]);

  const updateGym = useCallback(async (id: string, data: UpdateGymRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await gymApi.updateGym(id, data);

      // Close modal and refresh gyms
      setState(prev => ({
        ...prev,
        isEditModalOpen: false,
        selectedGym: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Gym updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the gym list
      await loadGyms(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update gym';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadGyms, lastParams]);

  const deleteGym = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await gymApi.deleteGym(id);

      // Close modal and refresh gyms
      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        selectedGym: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Gym deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the gym list
      await loadGyms(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete gym';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadGyms, lastParams]);

  // Modal Controls
  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const openEditModal = useCallback((gym: Gym) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedGym: gym,
    }));
  }, []);

  const openDeleteModal = useCallback((gym: Gym) => {
    setState(prev => ({
      ...prev,
      isDeleteModalOpen: true,
      selectedGym: gym,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      selectedGym: null,
    }));
  }, []);

  const refreshGyms = useCallback(() => {
    return loadGyms(lastParams);
  }, [loadGyms, lastParams]);

  return {
    ...state,
    loadGyms,
    createGym,
    updateGym,
    deleteGym,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    refreshGyms,
  };
};