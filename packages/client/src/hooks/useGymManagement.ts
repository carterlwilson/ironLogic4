import type { Gym, CreateGymRequest, UpdateGymRequest, GymListParams } from '@ironlogic4/shared/types/gyms';
import { gymApi } from '../services/gymApi';
import { useEntityManagement, PaginationData } from './useEntityManagement';

interface UseGymManagementReturn {
  gyms: Gym[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedGym: Gym | null;
  loadGyms: (params?: GymListParams) => Promise<void>;
  createGym: (data: CreateGymRequest) => Promise<void>;
  updateGym: (id: string, data: UpdateGymRequest) => Promise<void>;
  deleteGym: (id: string) => Promise<void>;
  openAddModal: () => void;
  openEditModal: (gym: Gym) => void;
  openDeleteModal: (gym: Gym) => void;
  closeModals: () => void;
  refreshGyms: () => Promise<void>;
}

export const useGymManagement = (): UseGymManagementReturn => {
  const mgmt = useEntityManagement<Gym, CreateGymRequest, UpdateGymRequest, GymListParams>({
    api: {
      list: gymApi.getGyms,
      create: gymApi.createGym,
      update: (id, data) => gymApi.updateGym(id, data),
      delete: gymApi.deleteGym,
    },
    entityLabel: 'Gym',
    defaultParams: {},
  });

  return {
    gyms: mgmt.items,
    pagination: mgmt.pagination,
    loading: mgmt.loading,
    error: mgmt.error,
    isAddModalOpen: mgmt.isAddModalOpen,
    isEditModalOpen: mgmt.isEditModalOpen,
    isDeleteModalOpen: mgmt.isDeleteModalOpen,
    selectedGym: mgmt.selectedItem,
    loadGyms: mgmt.loadItems,
    createGym: async (data) => { await mgmt.createItem(data); },
    updateGym: mgmt.updateItem,
    deleteGym: mgmt.deleteItem,
    openAddModal: mgmt.openAddModal,
    openEditModal: mgmt.openEditModal,
    openDeleteModal: mgmt.openDeleteModal,
    closeModals: mgmt.closeModals,
    refreshGyms: mgmt.refresh,
  };
};
