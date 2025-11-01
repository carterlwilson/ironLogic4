import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import { benchmarkTemplateApi, BenchmarkTemplateListParams, CreateBenchmarkTemplateRequest, UpdateBenchmarkTemplateRequest } from '../services/benchmarkTemplateApi';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseBenchmarkTemplateManagementState {
  // Data
  benchmarkTemplates: BenchmarkTemplate[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;

  // UI State
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedBenchmarkTemplate: BenchmarkTemplate | null;
}

interface UseBenchmarkTemplateManagementReturn extends UseBenchmarkTemplateManagementState {
  // Actions
  loadBenchmarkTemplates: (params?: BenchmarkTemplateListParams) => Promise<void>;
  createBenchmarkTemplate: (data: CreateBenchmarkTemplateRequest) => Promise<void>;
  updateBenchmarkTemplate: (id: string, data: UpdateBenchmarkTemplateRequest) => Promise<void>;
  deleteBenchmarkTemplate: (id: string) => Promise<void>;

  // Modal Controls
  openAddModal: () => void;
  openEditModal: (template: BenchmarkTemplate) => void;
  openDeleteModal: (template: BenchmarkTemplate) => void;
  closeModals: () => void;

  // Utility
  refreshBenchmarkTemplates: () => Promise<void>;
}

const initialState: UseBenchmarkTemplateManagementState = {
  benchmarkTemplates: [],
  pagination: null,
  loading: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  selectedBenchmarkTemplate: null,
};

export const useBenchmarkTemplateManagement = (): UseBenchmarkTemplateManagementReturn => {
  const [state, setState] = useState<UseBenchmarkTemplateManagementState>(initialState);
  const [lastParams, setLastParams] = useState<BenchmarkTemplateListParams>({ page: 1, limit: 10 });

  const loadBenchmarkTemplates = useCallback(async (params: BenchmarkTemplateListParams = { page: 1, limit: 10 }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastParams(params);

    try {
      const response = await benchmarkTemplateApi.getBenchmarkTemplates(params);

      setState(prev => ({
        ...prev,
        benchmarkTemplates: response.data || [],
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load benchmark templates';
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

  const createBenchmarkTemplate = useCallback(async (data: CreateBenchmarkTemplateRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await benchmarkTemplateApi.createBenchmarkTemplate(data);

      // Close modal and refresh templates
      setState(prev => ({
        ...prev,
        isAddModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Benchmark template created successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the benchmark template list
      await loadBenchmarkTemplates(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create benchmark template';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadBenchmarkTemplates, lastParams]);

  const updateBenchmarkTemplate = useCallback(async (id: string, data: UpdateBenchmarkTemplateRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await benchmarkTemplateApi.updateBenchmarkTemplate(id, data);

      // Close modal and refresh templates
      setState(prev => ({
        ...prev,
        isEditModalOpen: false,
        selectedBenchmarkTemplate: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Benchmark template updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the benchmark template list
      await loadBenchmarkTemplates(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update benchmark template';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadBenchmarkTemplates, lastParams]);

  const deleteBenchmarkTemplate = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await benchmarkTemplateApi.deleteBenchmarkTemplate(id);

      // Close modal and refresh templates
      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        selectedBenchmarkTemplate: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Benchmark template deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the benchmark template list
      await loadBenchmarkTemplates(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete benchmark template';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadBenchmarkTemplates, lastParams]);

  // Modal Controls
  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const openEditModal = useCallback((template: BenchmarkTemplate) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedBenchmarkTemplate: template,
    }));
  }, []);

  const openDeleteModal = useCallback((template: BenchmarkTemplate) => {
    setState(prev => ({
      ...prev,
      isDeleteModalOpen: true,
      selectedBenchmarkTemplate: template,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      selectedBenchmarkTemplate: null,
    }));
  }, []);

  const refreshBenchmarkTemplates = useCallback(() => {
    return loadBenchmarkTemplates(lastParams);
  }, [loadBenchmarkTemplates, lastParams]);

  return {
    ...state,
    loadBenchmarkTemplates,
    createBenchmarkTemplate,
    updateBenchmarkTemplate,
    deleteBenchmarkTemplate,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    refreshBenchmarkTemplates,
  };
};