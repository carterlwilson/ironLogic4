import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import { clientBenchmarkApi } from '../services/clientBenchmarkApi';
import type { CreateMyBenchmarkInput, UpdateMyBenchmarkInput } from '@ironlogic4/shared';

interface UseMyBenchmarksState {
  // Data
  currentBenchmarks: ClientBenchmark[];
  historicalBenchmarks: ClientBenchmark[];
  loading: boolean;
  error: string | null;

  // UI State
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isCreateNewFromOldModalOpen: boolean;
  selectedBenchmark: ClientBenchmark | null;
  selectedTemplate: BenchmarkTemplate | null;
}

interface UseMyBenchmarksReturn extends UseMyBenchmarksState {
  // Actions
  loadBenchmarks: () => Promise<void>;
  createBenchmark: (data: CreateMyBenchmarkInput) => Promise<void>;
  updateBenchmark: (benchmarkId: string, data: UpdateMyBenchmarkInput) => Promise<void>;
  createNewFromOld: (oldBenchmark: ClientBenchmark, data: CreateMyBenchmarkInput) => Promise<void>;

  // Modal Controls
  openCreateModal: (template: BenchmarkTemplate) => void;
  openEditModal: (benchmark: ClientBenchmark) => void;
  openCreateNewFromOldModal: (benchmark: ClientBenchmark) => void;
  closeModals: () => void;

  // Utility
  refreshBenchmarks: () => Promise<void>;
}

const initialState: UseMyBenchmarksState = {
  currentBenchmarks: [],
  historicalBenchmarks: [],
  loading: false,
  error: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isCreateNewFromOldModalOpen: false,
  selectedBenchmark: null,
  selectedTemplate: null,
};

export const useMyBenchmarks = (): UseMyBenchmarksReturn => {
  const [state, setState] = useState<UseMyBenchmarksState>(initialState);

  const loadBenchmarks = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await clientBenchmarkApi.getMyBenchmarks();

      setState(prev => ({
        ...prev,
        currentBenchmarks: response.currentBenchmarks || [],
        historicalBenchmarks: response.historicalBenchmarks || [],
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load benchmarks';
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

  const createBenchmark = useCallback(async (data: CreateMyBenchmarkInput) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await clientBenchmarkApi.createMyBenchmark(data);

      // Close modal and refresh benchmarks
      setState(prev => ({
        ...prev,
        isCreateModalOpen: false,
        selectedTemplate: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Benchmark created successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the benchmark list
      await loadBenchmarks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create benchmark';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  }, [loadBenchmarks]);

  const updateBenchmark = useCallback(async (benchmarkId: string, data: UpdateMyBenchmarkInput) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await clientBenchmarkApi.updateMyBenchmark(benchmarkId, data);

      // Close modal and refresh benchmarks
      setState(prev => ({
        ...prev,
        isEditModalOpen: false,
        selectedBenchmark: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Benchmark updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the benchmark list
      await loadBenchmarks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update benchmark';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  }, [loadBenchmarks]);

  const createNewFromOld = useCallback(async (oldBenchmark: ClientBenchmark, data: CreateMyBenchmarkInput) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Create the new benchmark and pass the old benchmark ID to move it to historical
      await clientBenchmarkApi.createMyBenchmark({
        ...data,
        oldBenchmarkId: oldBenchmark.id,
      });

      // Close modal
      setState(prev => ({
        ...prev,
        isCreateNewFromOldModalOpen: false,
        selectedBenchmark: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'New benchmark created and old benchmark moved to historical',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the benchmark list
      await loadBenchmarks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create benchmark';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  }, [loadBenchmarks]);

  // Modal Controls
  const openCreateModal = useCallback((template: BenchmarkTemplate) => {
    setState(prev => ({
      ...prev,
      isCreateModalOpen: true,
      selectedTemplate: template,
    }));
  }, []);

  const openEditModal = useCallback((benchmark: ClientBenchmark) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedBenchmark: benchmark,
    }));
  }, []);

  const openCreateNewFromOldModal = useCallback((benchmark: ClientBenchmark) => {
    setState(prev => ({
      ...prev,
      isCreateNewFromOldModalOpen: true,
      selectedBenchmark: benchmark,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCreateModalOpen: false,
      isEditModalOpen: false,
      isCreateNewFromOldModalOpen: false,
      selectedBenchmark: null,
      selectedTemplate: null,
    }));
  }, []);

  const refreshBenchmarks = useCallback(() => {
    return loadBenchmarks();
  }, [loadBenchmarks]);

  return {
    ...state,
    loadBenchmarks,
    createBenchmark,
    updateBenchmark,
    createNewFromOld,
    openCreateModal,
    openEditModal,
    openCreateNewFromOldModal,
    closeModals,
    refreshBenchmarks,
  };
};