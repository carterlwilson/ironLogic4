import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
  ClientBenchmark,
  BenchmarkTemplate,
  CreateMyBenchmarkInput,
  UpdateMyBenchmarkInput,
  RepMax,
} from '@ironlogic4/shared';
import {
  getBenchmarks,
  createBenchmark,
  updateBenchmark,
  getBenchmarkTemplates,
  getBenchmarkTemplate,
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
  isCreateNewRepMaxOpen: boolean;
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
    isCreateNewRepMaxOpen: false,
    selectedBenchmark: null,
    selectedTemplate: null,
  });

  const [benchmarkTemplates, setBenchmarkTemplates] = useState<Map<string, BenchmarkTemplate>>(new Map());
  const [selectedRepMax, setSelectedRepMax] = useState<{
    repMax: RepMax;
    benchmarkId: string;
    allRepMaxes: RepMax[];
    templateRepMaxName: string;
    benchmarkName: string;
  } | null>(null);
  const [isEditRepMaxOpen, setIsEditRepMaxOpen] = useState(false);
  const [selectedRepMaxForNew, setSelectedRepMaxForNew] = useState<{
    repMax: RepMax;
    benchmark: ClientBenchmark;
    template: BenchmarkTemplate;
    templateRepMaxName: string;
    templateRepMaxReps: number;
  } | null>(null);

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
        setModalState((prev) => ({
          ...prev,
          isCreateOpen: false,
          isCreateNewFromOldOpen: false,
          isCreateNewRepMaxOpen: false
        }));
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
      isCreateNewRepMaxOpen: false,
      selectedBenchmark: null,
      selectedTemplate: null,
    });
    setIsEditRepMaxOpen(false);
    setSelectedRepMax(null);
    setSelectedRepMaxForNew(null);
  }, []);

  /**
   * Load benchmark templates for benchmarks
   */
  const loadBenchmarkTemplates = useCallback(async (templateIds: string[]) => {
    try {
      const templates = await Promise.all(
        templateIds.map((id) => getBenchmarkTemplate(id))
      );
      const templateMap = new Map(
        templates.map((t) => [t.data.id, t.data])
      );
      setBenchmarkTemplates(templateMap);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  /**
   * Open edit rep max modal
   */
  const openEditRepMax = useCallback(
    (repMax: RepMax, benchmarkId: string, allRepMaxes: RepMax[], templateRepMaxName: string, benchmarkName: string) => {
      setSelectedRepMax({ repMax, benchmarkId, allRepMaxes, templateRepMaxName, benchmarkName });
      setIsEditRepMaxOpen(true);
    },
    []
  );

  /**
   * Open create new from old rep max modal
   */
  const openCreateNewRepMax = useCallback(
    (repMax: RepMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateRepMaxName: string, templateRepMaxReps: number) => {
      setSelectedRepMaxForNew({ repMax, benchmark, template, templateRepMaxName, templateRepMaxReps });
      setModalState((prev) => ({ ...prev, isCreateNewRepMaxOpen: true }));
    },
    []
  );

  /**
   * Update a specific rep max
   */
  const handleUpdateRepMax = useCallback(
    async (benchmarkId: string, updatedRepMaxes: RepMax[]) => {
      await handleUpdateBenchmark(benchmarkId, { repMaxes: updatedRepMaxes });
      setIsEditRepMaxOpen(false);
      setSelectedRepMax(null);
    },
    [handleUpdateBenchmark]
  );

  /**
   * Load benchmarks and templates on mount
   */
  useEffect(() => {
    loadBenchmarks();
    loadTemplates();
  }, [loadBenchmarks, loadTemplates]);

  /**
   * Load full templates when benchmarks change
   */
  useEffect(() => {
    if (state.currentBenchmarks.length > 0) {
      const templateIds = [...new Set(state.currentBenchmarks.map((b) => b.templateId))];
      loadBenchmarkTemplates(templateIds);
    }
  }, [state.currentBenchmarks, loadBenchmarkTemplates]);

  return {
    // Data
    currentBenchmarks: state.currentBenchmarks,
    historicalBenchmarks: state.historicalBenchmarks,
    templates: state.templates,
    benchmarkTemplates,
    loading: state.loading,
    error: state.error,

    // Modal state
    isCreateOpen: modalState.isCreateOpen,
    isEditOpen: modalState.isEditOpen,
    isCreateNewFromOldOpen: modalState.isCreateNewFromOldOpen,
    isCreateNewRepMaxOpen: modalState.isCreateNewRepMaxOpen,
    isEditRepMaxOpen,
    selectedBenchmark: modalState.selectedBenchmark,
    selectedTemplate: modalState.selectedTemplate,
    selectedRepMax,
    selectedRepMaxForNew,

    // Actions
    loadBenchmarks,
    loadTemplates,
    handleCreateBenchmark,
    handleUpdateBenchmark,
    handleUpdateRepMax,
    openCreate,
    openEdit,
    openCreateNewFromOld,
    openEditRepMax,
    openCreateNewRepMax,
    closeModals,
  };
}