import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import { benchmarkTemplateApi, BenchmarkTemplateListParams, CreateBenchmarkTemplateRequest, UpdateBenchmarkTemplateRequest } from '../services/benchmarkTemplateApi';
import { useEntityManagement, PaginationData } from './useEntityManagement';

interface UseBenchmarkTemplateManagementReturn {
  benchmarkTemplates: BenchmarkTemplate[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedBenchmarkTemplate: BenchmarkTemplate | null;
  loadBenchmarkTemplates: (params?: BenchmarkTemplateListParams) => Promise<void>;
  createBenchmarkTemplate: (data: CreateBenchmarkTemplateRequest) => Promise<void>;
  updateBenchmarkTemplate: (id: string, data: UpdateBenchmarkTemplateRequest) => Promise<void>;
  deleteBenchmarkTemplate: (id: string) => Promise<void>;
  openAddModal: () => void;
  openEditModal: (template: BenchmarkTemplate) => void;
  openDeleteModal: (template: BenchmarkTemplate) => void;
  closeModals: () => void;
  refreshBenchmarkTemplates: () => Promise<void>;
}

export const useBenchmarkTemplateManagement = (): UseBenchmarkTemplateManagementReturn => {
  const mgmt = useEntityManagement<BenchmarkTemplate, CreateBenchmarkTemplateRequest, UpdateBenchmarkTemplateRequest, BenchmarkTemplateListParams>({
    api: {
      list: benchmarkTemplateApi.getBenchmarkTemplates,
      create: benchmarkTemplateApi.createBenchmarkTemplate,
      update: (id, data) => benchmarkTemplateApi.updateBenchmarkTemplate(id, data),
      delete: benchmarkTemplateApi.deleteBenchmarkTemplate,
    },
    entityLabel: 'Benchmark Template',
    defaultParams: { page: 1, limit: 10 },
  });

  return {
    benchmarkTemplates: mgmt.items,
    pagination: mgmt.pagination,
    loading: mgmt.loading,
    error: mgmt.error,
    isAddModalOpen: mgmt.isAddModalOpen,
    isEditModalOpen: mgmt.isEditModalOpen,
    isDeleteModalOpen: mgmt.isDeleteModalOpen,
    selectedBenchmarkTemplate: mgmt.selectedItem,
    loadBenchmarkTemplates: mgmt.loadItems,
    createBenchmarkTemplate: async (data) => { await mgmt.createItem(data); },
    updateBenchmarkTemplate: mgmt.updateItem,
    deleteBenchmarkTemplate: mgmt.deleteItem,
    openAddModal: mgmt.openAddModal,
    openEditModal: mgmt.openEditModal,
    openDeleteModal: mgmt.openDeleteModal,
    closeModals: mgmt.closeModals,
    refreshBenchmarkTemplates: mgmt.refresh,
  };
};
