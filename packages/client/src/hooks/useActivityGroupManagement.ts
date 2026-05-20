import type { ActivityGroup, ActivityGroupListParams } from '@ironlogic4/shared/types/activityGroups';
import { activityGroupApi, CreateActivityGroupRequest, UpdateActivityGroupRequest } from '../services/activityGroupApi';
import { useEntityManagement, PaginationData } from './useEntityManagement';

interface UseActivityGroupManagementReturn {
  activityGroups: ActivityGroup[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedActivityGroup: ActivityGroup | null;
  loadActivityGroups: (params?: ActivityGroupListParams) => Promise<void>;
  createActivityGroup: (data: CreateActivityGroupRequest) => Promise<void>;
  updateActivityGroup: (id: string, data: UpdateActivityGroupRequest) => Promise<void>;
  deleteActivityGroup: (id: string) => Promise<void>;
  openAddModal: () => void;
  openEditModal: (group: ActivityGroup) => void;
  openDeleteModal: (group: ActivityGroup) => void;
  closeModals: () => void;
  refreshActivityGroups: () => Promise<void>;
}

export const useActivityGroupManagement = (): UseActivityGroupManagementReturn => {
  const mgmt = useEntityManagement<ActivityGroup, CreateActivityGroupRequest, UpdateActivityGroupRequest, ActivityGroupListParams>({
    api: {
      list: activityGroupApi.getActivityGroups,
      create: activityGroupApi.createActivityGroup,
      update: (id, data) => activityGroupApi.updateActivityGroup(id, data),
      delete: activityGroupApi.deleteActivityGroup,
    },
    entityLabel: 'Activity Group',
    defaultParams: { page: 1, limit: 10 },
  });

  return {
    activityGroups: mgmt.items,
    pagination: mgmt.pagination,
    loading: mgmt.loading,
    error: mgmt.error,
    isAddModalOpen: mgmt.isAddModalOpen,
    isEditModalOpen: mgmt.isEditModalOpen,
    isDeleteModalOpen: mgmt.isDeleteModalOpen,
    selectedActivityGroup: mgmt.selectedItem,
    loadActivityGroups: mgmt.loadItems,
    createActivityGroup: async (data) => { await mgmt.createItem(data); },
    updateActivityGroup: mgmt.updateItem,
    deleteActivityGroup: mgmt.deleteItem,
    openAddModal: mgmt.openAddModal,
    openEditModal: mgmt.openEditModal,
    openDeleteModal: mgmt.openDeleteModal,
    closeModals: mgmt.closeModals,
    refreshActivityGroups: mgmt.refresh,
  };
};
