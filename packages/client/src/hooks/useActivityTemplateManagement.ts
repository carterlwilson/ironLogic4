import type { ActivityTemplate, CreateActivityTemplateRequest, UpdateActivityTemplateRequest, ActivityTemplateListParams } from '@ironlogic4/shared/types/activityTemplates';
import { activityTemplateApi } from '../services/activityTemplateApi';
import { useEntityManagement, PaginationData } from './useEntityManagement';

interface UseActivityTemplateManagementReturn {
  activityTemplates: ActivityTemplate[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedActivityTemplate: ActivityTemplate | null;
  loadActivityTemplates: (params?: ActivityTemplateListParams) => Promise<void>;
  createActivityTemplate: (data: CreateActivityTemplateRequest) => Promise<void>;
  updateActivityTemplate: (id: string, data: UpdateActivityTemplateRequest) => Promise<void>;
  deleteActivityTemplate: (id: string) => Promise<void>;
  openAddModal: () => void;
  openEditModal: (template: ActivityTemplate) => void;
  openDeleteModal: (template: ActivityTemplate) => void;
  closeModals: () => void;
  refreshActivityTemplates: () => Promise<void>;
}

export const useActivityTemplateManagement = (): UseActivityTemplateManagementReturn => {
  const mgmt = useEntityManagement<ActivityTemplate, CreateActivityTemplateRequest, UpdateActivityTemplateRequest, ActivityTemplateListParams>({
    api: {
      list: activityTemplateApi.getActivityTemplates,
      create: activityTemplateApi.createActivityTemplate,
      update: (id, data) => activityTemplateApi.updateActivityTemplate(id, data),
      delete: activityTemplateApi.deleteActivityTemplate,
    },
    entityLabel: 'Activity Template',
    defaultParams: {},
  });

  return {
    activityTemplates: mgmt.items,
    pagination: mgmt.pagination,
    loading: mgmt.loading,
    error: mgmt.error,
    isAddModalOpen: mgmt.isAddModalOpen,
    isEditModalOpen: mgmt.isEditModalOpen,
    isDeleteModalOpen: mgmt.isDeleteModalOpen,
    selectedActivityTemplate: mgmt.selectedItem,
    loadActivityTemplates: mgmt.loadItems,
    createActivityTemplate: async (data) => { await mgmt.createItem(data); },
    updateActivityTemplate: mgmt.updateItem,
    deleteActivityTemplate: mgmt.deleteItem,
    openAddModal: mgmt.openAddModal,
    openEditModal: mgmt.openEditModal,
    openDeleteModal: mgmt.openDeleteModal,
    closeModals: mgmt.closeModals,
    refreshActivityTemplates: mgmt.refresh,
  };
};
