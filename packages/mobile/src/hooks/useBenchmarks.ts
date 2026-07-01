import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import {
  ClientBenchmark,
  BenchmarkTemplate,
  CreateMyBenchmarkInput,
  UpdateMyBenchmarkInput,
  RepMax,
  TimeSubMax,
  DistanceSubMax,
} from '@ironlogic4/shared';
import {
  getBenchmarks,
  getBenchmarkTemplates,
  createBenchmark,
  updateBenchmark,
  deleteBenchmark,
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
    isCreateNewRepMaxOpen: false,
    selectedBenchmark: null,
    selectedTemplate: null,
  });

  const [benchmarkToDelete, setBenchmarkToDelete] = useState<ClientBenchmark | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [benchmarkTemplates, setBenchmarkTemplates] = useState<Map<string, BenchmarkTemplate>>(new Map());

  const [selectedRepMaxForNew, setSelectedRepMaxForNew] = useState<{
    repMax: RepMax;
    benchmark: ClientBenchmark;
    template: BenchmarkTemplate;
    templateRepMaxName: string;
    templateRepMaxReps: number;
  } | null>(null);

  const [selectedTimeSubMaxForNew, setSelectedTimeSubMaxForNew] = useState<{
    timeSubMax: TimeSubMax;
    benchmark: ClientBenchmark;
    template: BenchmarkTemplate;
    templateSubMaxName: string;
  } | null>(null);

  const [selectedDistanceSubMaxForNew, setSelectedDistanceSubMaxForNew] = useState<{
    distanceSubMax: DistanceSubMax;
    benchmark: ClientBenchmark;
    template: BenchmarkTemplate;
    templateDistanceSubMaxName: string;
  } | null>(null);

  /**
   * Load benchmarks from API (now includes templates in response)
   */
  const loadBenchmarks = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [response, templatesResponse] = await Promise.all([
        getBenchmarks(),
        getBenchmarkTemplates(),
      ]);

      const templateMap = new Map(
        response.data.templates.map((t) => [t.id, t])
      );
      setBenchmarkTemplates(templateMap);

      setState((prev) => ({
        ...prev,
        currentBenchmarks: response.data.currentBenchmarks || [],
        historicalBenchmarks: response.data.historicalBenchmarks || [],
        templates: templatesResponse.data,
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
          isEditOpen: false,
          isCreateNewRepMaxOpen: false,
        }));
        setSelectedRepMaxForNew(null);
        setSelectedTimeSubMaxForNew(null);
        setSelectedDistanceSubMaxForNew(null);
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
   * Open delete confirmation modal
   */
  const openDelete = useCallback((benchmark: ClientBenchmark) => {
    setBenchmarkToDelete(benchmark);
    setIsDeleteOpen(true);
  }, []);

  /**
   * Cancel benchmark deletion
   */
  const cancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
    setBenchmarkToDelete(null);
  }, []);

  /**
   * Confirm and execute benchmark deletion
   */
  const confirmDelete = useCallback(async () => {
    if (!benchmarkToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBenchmark(benchmarkToDelete.id);
      setState((prev) => ({
        ...prev,
        currentBenchmarks: prev.currentBenchmarks.filter((b) => b.id !== benchmarkToDelete.id),
        historicalBenchmarks: prev.historicalBenchmarks.filter((b) => b.id !== benchmarkToDelete.id),
      }));
      setIsDeleteOpen(false);
      setBenchmarkToDelete(null);
      notifications.show({
        title: 'Benchmark deleted',
        message: `"${benchmarkToDelete.name}" and all its data have been permanently deleted.`,
        color: 'green',
        autoClose: 4000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete benchmark';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [benchmarkToDelete]);

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
   * Close all modals
   */
  const closeModals = useCallback(() => {
    setModalState({
      isCreateOpen: false,
      isEditOpen: false,
      isCreateNewRepMaxOpen: false,
      selectedBenchmark: null,
      selectedTemplate: null,
    });
    setSelectedRepMaxForNew(null);
    setSelectedTimeSubMaxForNew(null);
    setSelectedDistanceSubMaxForNew(null);
  }, []);

  /**
   * Open create new rep max modal (universal entry point for all rep max updates)
   */
  const openCreateNewRepMax = useCallback(
    (repMax: RepMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateRepMaxName: string, templateRepMaxReps: number) => {
      setSelectedRepMaxForNew({ repMax, benchmark, template, templateRepMaxName, templateRepMaxReps });
      setModalState((prev) => ({ ...prev, isCreateNewRepMaxOpen: true }));
    },
    []
  );

  /**
   * Open create new time sub max modal (universal entry point for all time sub-max updates)
   */
  const openCreateNewTimeSubMax = useCallback(
    (timeSubMax: TimeSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateSubMaxName: string) => {
      setSelectedTimeSubMaxForNew({ timeSubMax, benchmark, template, templateSubMaxName });
    },
    []
  );

  /**
   * Open create new distance sub max modal (universal entry point for all distance sub-max updates)
   */
  const openCreateNewDistanceSubMax = useCallback(
    (distanceSubMax: DistanceSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateDistanceSubMaxName: string) => {
      setSelectedDistanceSubMaxForNew({ distanceSubMax, benchmark, template, templateDistanceSubMaxName });
    },
    []
  );

  useEffect(() => {
    loadBenchmarks();
  }, [loadBenchmarks]);

  return {
    // Data
    currentBenchmarks: state.currentBenchmarks,
    historicalBenchmarks: state.historicalBenchmarks,
    templates: state.templates,
    benchmarkTemplates,
    loading: state.loading,
    error: state.error,

    // Delete state
    isDeleteOpen,
    isDeleting,
    benchmarkToDelete,

    // Modal state
    isCreateOpen: modalState.isCreateOpen,
    isEditOpen: modalState.isEditOpen,
    isCreateNewRepMaxOpen: modalState.isCreateNewRepMaxOpen,
    selectedBenchmark: modalState.selectedBenchmark,
    selectedTemplate: modalState.selectedTemplate,
    selectedRepMaxForNew,
    selectedTimeSubMaxForNew,
    selectedDistanceSubMaxForNew,

    // Actions
    openDelete,
    cancelDelete,
    confirmDelete,
    loadBenchmarks,
    handleCreateBenchmark,
    handleUpdateBenchmark,
    openCreate,
    openEdit,
    openCreateNewRepMax,
    openCreateNewTimeSubMax,
    openCreateNewDistanceSubMax,
    closeModals,
  };
}
