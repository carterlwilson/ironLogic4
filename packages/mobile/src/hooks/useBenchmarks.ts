import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
  ClientBenchmark,
  BenchmarkTemplate,
  CreateMyBenchmarkInput,
  UpdateMyBenchmarkInput,
} from '@ironlogic4/shared';
import {
  getBenchmarks,
  createBenchmark,
  updateBenchmark,
  getBenchmarkTemplates,
} from '../services/benchmarkApi';

interface BenchmarksState {
  currentBenchmarks: ClientBenchmark[];
  historicalBenchmarks: ClientBenchmark[];
  templates: BenchmarkTemplate[];
  loading: boolean;
  error: string | null;
}

interface ModalState {
  isCreateOpen: boolean;
  isEditOpen: boolean;
  isCreateNewFromOldOpen: boolean;
  selectedBenchmark: ClientBenchmark | null;
  selectedTemplate: BenchmarkTemplate | null;
}

export function useBenchmarks() {
  const [state, setState] = useState<BenchmarksState>({
    currentBenchmarks: [],
    historicalBenchmarks: [],
    templates: [],
    loading: false,
    error: null,
  });

  const [modalState, setModalState] = useState<ModalState>({
    isCreateOpen: false,
    isEditOpen: false,
    isCreateNewFromOldOpen: false,
    selectedBenchmark: null,
    selectedTemplate: null,
  });

  /**
   * Load benchmarks from API
   */
  const loadBenchmarks = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await getBenchmarks();
      setState((prev) => ({
        ...prev,
        currentBenchmarks: response.data.currentBenchmarks || [],
        historicalBenchmarks: response.data.historicalBenchmarks || [],
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load benchmarks';
      setState((prev) => ({
        ...prev,
        currentBenchmarks: prev.currentBenchmarks || [],
        historicalBenchmarks: prev.historicalBenchmarks || [],
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

  /**
   * Load benchmark templates
   */
  const loadTemplates = useCallback(async () => {
    try {
      const response = await getBenchmarkTemplates();
      setState((prev) => ({
        ...prev,
        templates: response.data,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, []);

  /**
   * Create a new benchmark
   */
  const handleCreateBenchmark = useCallback(
    async (data: CreateMyBenchmarkInput) => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const response = await createBenchmark(data);
        // Reload benchmarks to get fresh data from server
        await loadBenchmarks();
        setModalState((prev) => ({ ...prev, isCreateOpen: false, isCreateNewFromOldOpen: false }));
        notifications.show({
          title: 'Success',
          message: response.message || 'Benchmark created successfully',
          color: 'green',
          autoClose: 3000,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create benchmark';
        setState((prev) => ({ ...prev, loading: false }));
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          autoClose: 5000,
        });
      }
    },
    [loadBenchmarks]
  );

  /**
   * Update an existing benchmark
   */
  const handleUpdateBenchmark = useCallback(
    async (benchmarkId: string, data: UpdateMyBenchmarkInput) => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const response = await updateBenchmark(benchmarkId, data);
        // Reload benchmarks to get fresh data from server
        await loadBenchmarks();
        setModalState((prev) => ({ ...prev, isEditOpen: false }));
        notifications.show({
          title: 'Success',
          message: response.message || 'Benchmark updated successfully',
          color: 'green',
          autoClose: 3000,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update benchmark';
        setState((prev) => ({ ...prev, loading: false }));
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          autoClose: 5000,
        });
      }
    },
    [loadBenchmarks]
  );

  /**
   * Open create modal
   */
  const openCreate = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isCreateOpen: true,
      selectedBenchmark: null,
      selectedTemplate: null,
    }));
  }, []);

  /**
   * Open edit modal
   */
  const openEdit = useCallback((benchmark: ClientBenchmark) => {
    setModalState((prev) => ({
      ...prev,
      isEditOpen: true,
      selectedBenchmark: benchmark,
    }));
  }, []);

  /**
   * Open create new from old modal
   */
  const openCreateNewFromOld = useCallback((benchmark: ClientBenchmark) => {
    setModalState((prev) => ({
      ...prev,
      isCreateNewFromOldOpen: true,
      selectedBenchmark: benchmark,
    }));
  }, []);

  /**
   * Close all modals
   */
  const closeModals = useCallback(() => {
    setModalState({
      isCreateOpen: false,
      isEditOpen: false,
      isCreateNewFromOldOpen: false,
      selectedBenchmark: null,
      selectedTemplate: null,
    });
  }, []);

  /**
   * Load benchmarks and templates on mount
   */
  useEffect(() => {
    loadBenchmarks();
    loadTemplates();
  }, [loadBenchmarks, loadTemplates]);

  return {
    // Data
    currentBenchmarks: state.currentBenchmarks,
    historicalBenchmarks: state.historicalBenchmarks,
    templates: state.templates,
    loading: state.loading,
    error: state.error,

    // Modal state
    isCreateOpen: modalState.isCreateOpen,
    isEditOpen: modalState.isEditOpen,
    isCreateNewFromOldOpen: modalState.isCreateNewFromOldOpen,
    selectedBenchmark: modalState.selectedBenchmark,
    selectedTemplate: modalState.selectedTemplate,

    // Actions
    loadBenchmarks,
    loadTemplates,
    handleCreateBenchmark,
    handleUpdateBenchmark,
    openCreate,
    openEdit,
    openCreateNewFromOld,
    closeModals,
  };
}