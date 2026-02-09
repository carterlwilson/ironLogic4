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
import { DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
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

  const [selectedTimeSubMax, setSelectedTimeSubMax] = useState<{
    timeSubMax: TimeSubMax;
    benchmarkId: string;
    allTimeSubMaxes: TimeSubMax[];
    templateSubMaxName: string;
    benchmarkName: string;
    distanceUnit: DistanceUnit;
  } | null>(null);
  const [isEditTimeSubMaxOpen, setIsEditTimeSubMaxOpen] = useState(false);
  const [selectedTimeSubMaxForNew, setSelectedTimeSubMaxForNew] = useState<{
    timeSubMax: TimeSubMax;
    benchmark: ClientBenchmark;
    template: BenchmarkTemplate;
    templateSubMaxName: string;
  } | null>(null);

  const [selectedDistanceSubMax, setSelectedDistanceSubMax] = useState<{
    distanceSubMax: DistanceSubMax;
    benchmarkId: string;
    allDistanceSubMaxes: DistanceSubMax[];
    templateDistanceSubMaxName: string;
    benchmarkName: string;
  } | null>(null);
  const [isEditDistanceSubMaxOpen, setIsEditDistanceSubMaxOpen] = useState(false);
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
      const response = await getBenchmarks();

      // Templates are now included in the response (fixes N+1 problem)
      const templateMap = new Map(
        response.data.templates.map((t) => [t.id, t])
      );
      setBenchmarkTemplates(templateMap);

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
    setIsEditTimeSubMaxOpen(false);
    setSelectedTimeSubMax(null);
    setSelectedTimeSubMaxForNew(null);
    setIsEditDistanceSubMaxOpen(false);
    setSelectedDistanceSubMax(null);
    setSelectedDistanceSubMaxForNew(null);
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
   * Open edit time sub max modal
   */
  const openEditTimeSubMax = useCallback(
    (timeSubMax: TimeSubMax, benchmarkId: string, allTimeSubMaxes: TimeSubMax[], templateSubMaxName: string, benchmarkName: string, distanceUnit: DistanceUnit) => {
      setSelectedTimeSubMax({ timeSubMax, benchmarkId, allTimeSubMaxes, templateSubMaxName, benchmarkName, distanceUnit });
      setIsEditTimeSubMaxOpen(true);
    },
    []
  );

  /**
   * Open create new from old time sub max modal
   */
  const openCreateNewTimeSubMax = useCallback(
    (timeSubMax: TimeSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateSubMaxName: string) => {
      setSelectedTimeSubMaxForNew({ timeSubMax, benchmark, template, templateSubMaxName });
      setModalState((prev) => ({ ...prev, isCreateNewRepMaxOpen: true }));
    },
    []
  );

  /**
   * Open edit distance sub max modal
   */
  const openEditDistanceSubMax = useCallback(
    (distanceSubMax: DistanceSubMax, benchmarkId: string, allDistanceSubMaxes: DistanceSubMax[], templateDistanceSubMaxName: string, benchmarkName: string) => {
      setSelectedDistanceSubMax({ distanceSubMax, benchmarkId, allDistanceSubMaxes, templateDistanceSubMaxName, benchmarkName });
      setIsEditDistanceSubMaxOpen(true);
    },
    []
  );

  /**
   * Open create new from old distance sub max modal
   */
  const openCreateNewDistanceSubMax = useCallback(
    (distanceSubMax: DistanceSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateDistanceSubMaxName: string) => {
      setSelectedDistanceSubMaxForNew({ distanceSubMax, benchmark, template, templateDistanceSubMaxName });
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
   * Update a specific time sub max
   */
  const handleUpdateTimeSubMax = useCallback(
    async (benchmarkId: string, updatedTimeSubMaxes: TimeSubMax[]) => {
      await handleUpdateBenchmark(benchmarkId, { timeSubMaxes: updatedTimeSubMaxes });
      setIsEditTimeSubMaxOpen(false);
      setSelectedTimeSubMax(null);
    },
    [handleUpdateBenchmark]
  );

  /**
   * Update a specific distance sub max
   */
  const handleUpdateDistanceSubMax = useCallback(
    async (benchmarkId: string, updatedDistanceSubMaxes: DistanceSubMax[]) => {
      await handleUpdateBenchmark(benchmarkId, { distanceSubMaxes: updatedDistanceSubMaxes });
      setIsEditDistanceSubMaxOpen(false);
      setSelectedDistanceSubMax(null);
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
    isEditTimeSubMaxOpen,
    selectedTimeSubMax,
    selectedTimeSubMaxForNew,
    isEditDistanceSubMaxOpen,
    selectedDistanceSubMax,
    selectedDistanceSubMaxForNew,

    // Actions
    loadBenchmarks,
    loadTemplates,
    handleCreateBenchmark,
    handleUpdateBenchmark,
    handleUpdateRepMax,
    handleUpdateTimeSubMax,
    handleUpdateDistanceSubMax,
    openCreate,
    openEdit,
    openCreateNewFromOld,
    openEditRepMax,
    openCreateNewRepMax,
    openEditTimeSubMax,
    openCreateNewTimeSubMax,
    openEditDistanceSubMax,
    openCreateNewDistanceSubMax,
    closeModals,
  };
}