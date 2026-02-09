import { Container, Title, Text, Stack, Tabs, ActionIcon, Group } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useBenchmarks } from '../hooks/useBenchmarks';
import { BenchmarkList } from '../components/benchmarks/BenchmarkList';
import { BenchmarkProgressList } from '../components/benchmarks/BenchmarkProgressList';
import { CreateBenchmarkModal } from '../components/benchmarks/CreateBenchmarkModal';
import { EditBenchmarkModal } from '../components/benchmarks/EditBenchmarkModal';
import { EditRepMaxModal } from '../components/benchmarks/EditRepMaxModal';
import { EditTimeSubMaxModal } from '../components/benchmarks/EditTimeSubMaxModal';
import { EditDistanceSubMaxModal } from '../components/benchmarks/EditDistanceSubMaxModal';
import { CreateNewFromOldModal } from '../components/benchmarks/CreateNewFromOldModal';
import { CreateNewRepMaxModal } from '../components/benchmarks/CreateNewRepMaxModal';
import { CreateNewTimeSubMaxModal } from '../components/benchmarks/CreateNewTimeSubMaxModal';
import { CreateNewDistanceSubMaxModal } from '../components/benchmarks/CreateNewDistanceSubMaxModal';
import { TagFilter } from '../components/benchmarks/TagFilter';
import { getAllUniqueTags, filterBenchmarksByTag } from '../utils/tagUtils';
import { DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';

export const BenchmarksPage = () => {
  const {
    currentBenchmarks,
    historicalBenchmarks,
    templates,
    benchmarkTemplates,
    loading,
    isCreateOpen,
    isEditOpen,
    isCreateNewFromOldOpen,
    isCreateNewRepMaxOpen,
    isEditRepMaxOpen,
    isEditTimeSubMaxOpen,
    isEditDistanceSubMaxOpen,
    selectedBenchmark,
    selectedRepMax,
    selectedRepMaxForNew,
    selectedTimeSubMax,
    selectedTimeSubMaxForNew,
    selectedDistanceSubMax,
    selectedDistanceSubMaxForNew,
    loadBenchmarks,
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
  } = useBenchmarks();

  // Tag filtering state
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filteredCurrentBenchmarks, setFilteredCurrentBenchmarks] = useState(currentBenchmarks);
  const [filteredHistoricalBenchmarks, setFilteredHistoricalBenchmarks] = useState(historicalBenchmarks);

  // Update available tags and filtered benchmarks when benchmarks change
  useEffect(() => {
    const allBenchmarks = [...currentBenchmarks, ...historicalBenchmarks];
    const tags = getAllUniqueTags(allBenchmarks);
    setAvailableTags(tags);

    // Auto-reset selectedTag if it no longer exists in available tags
    if (selectedTag && !tags.includes(selectedTag)) {
      setSelectedTag(null);
    }

    // Filter benchmarks
    const filteredCurrent = filterBenchmarksByTag(currentBenchmarks, selectedTag);
    const filteredHistorical = filterBenchmarksByTag(historicalBenchmarks, selectedTag);
    setFilteredCurrentBenchmarks(filteredCurrent);
    setFilteredHistoricalBenchmarks(filteredHistorical);
  }, [currentBenchmarks, historicalBenchmarks, selectedTag]);

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
  };

  return (
    <Container size="sm" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>Benchmarks</Title>
            <Text c="dimmed" size="sm">
              Track your performance progress
            </Text>
          </div>
          <Group gap="xs">
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() => loadBenchmarks()}
              disabled={loading}
            >
              <IconRefresh size={20} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              size="lg"
              color="forestGreen"
              onClick={openCreate}
            >
              <IconPlus size={20} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Tag Filter */}
        <TagFilter
          tags={availableTags}
          selectedTag={selectedTag}
          onTagSelect={handleTagSelect}
          currentCount={currentBenchmarks.length + historicalBenchmarks.length}
          filteredCount={filteredCurrentBenchmarks.length + filteredHistoricalBenchmarks.length}
        />

        {/* Tabs */}
        <Tabs defaultValue="current" variant="pills">
          <Tabs.List grow mb="md">
            <Tabs.Tab value="current">
              Current ({filteredCurrentBenchmarks.length})
            </Tabs.Tab>
            <Tabs.Tab value="historical">
              Historical ({filteredHistoricalBenchmarks.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="current">
            <BenchmarkList
              benchmarks={filteredCurrentBenchmarks}
              isHistorical={false}
              loading={loading}
              onEdit={openEdit}
              onCreateNew={openCreateNewFromOld}
              benchmarkTemplates={benchmarkTemplates}
              onEditRepMax={openEditRepMax}
              onCreateNewRepMax={openCreateNewRepMax}
              onEditTimeSubMax={openEditTimeSubMax}
              onCreateNewTimeSubMax={openCreateNewTimeSubMax}
              onEditDistanceSubMax={openEditDistanceSubMax}
              onCreateNewDistanceSubMax={openCreateNewDistanceSubMax}
            />
          </Tabs.Panel>

          <Tabs.Panel value="historical">
            <BenchmarkProgressList currentBenchmarks={filteredCurrentBenchmarks} />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Modals */}
      <CreateBenchmarkModal
        opened={isCreateOpen}
        onClose={closeModals}
        onCreate={handleCreateBenchmark}
        templates={templates}
        loading={loading}
      />

      <EditBenchmarkModal
        opened={isEditOpen}
        onClose={closeModals}
        onUpdate={handleUpdateBenchmark}
        benchmark={selectedBenchmark}
        loading={loading}
      />

      <EditRepMaxModal
        opened={isEditRepMaxOpen}
        onClose={closeModals}
        repMax={selectedRepMax?.repMax || null}
        benchmarkId={selectedRepMax?.benchmarkId || ''}
        benchmarkName={selectedRepMax?.benchmarkName || ''}
        templateRepMaxName={selectedRepMax?.templateRepMaxName || ''}
        allRepMaxes={selectedRepMax?.allRepMaxes || []}
        onUpdate={handleUpdateRepMax}
        loading={loading}
      />

      <CreateNewFromOldModal
        opened={isCreateNewFromOldOpen}
        onClose={closeModals}
        onCreate={handleCreateBenchmark}
        oldBenchmark={selectedBenchmark}
        loading={loading}
      />

      <CreateNewRepMaxModal
        opened={isCreateNewRepMaxOpen}
        onClose={closeModals}
        onCreate={handleCreateBenchmark}
        oldBenchmark={selectedRepMaxForNew?.benchmark || null}
        targetRepMax={selectedRepMaxForNew?.repMax || null}
        template={selectedRepMaxForNew?.template || null}
        loading={loading}
      />

      <EditTimeSubMaxModal
        opened={isEditTimeSubMaxOpen}
        onClose={closeModals}
        timeSubMax={selectedTimeSubMax?.timeSubMax || null}
        benchmarkId={selectedTimeSubMax?.benchmarkId || ''}
        benchmarkName={selectedTimeSubMax?.benchmarkName || ''}
        templateSubMaxName={selectedTimeSubMax?.templateSubMaxName || ''}
        distanceUnit={selectedTimeSubMax?.distanceUnit || DistanceUnit.METERS}
        allTimeSubMaxes={selectedTimeSubMax?.allTimeSubMaxes || []}
        onUpdate={handleUpdateTimeSubMax}
        loading={loading}
      />

      <EditDistanceSubMaxModal
        opened={isEditDistanceSubMaxOpen}
        onClose={closeModals}
        distanceSubMax={selectedDistanceSubMax?.distanceSubMax || null}
        benchmarkId={selectedDistanceSubMax?.benchmarkId || ''}
        benchmarkName={selectedDistanceSubMax?.benchmarkName || ''}
        templateDistanceSubMaxName={selectedDistanceSubMax?.templateDistanceSubMaxName || ''}
        allDistanceSubMaxes={selectedDistanceSubMax?.allDistanceSubMaxes || []}
        onUpdate={handleUpdateDistanceSubMax}
        loading={loading}
      />

      <CreateNewTimeSubMaxModal
        opened={Boolean(selectedTimeSubMaxForNew)}
        onClose={closeModals}
        onCreate={handleCreateBenchmark}
        oldBenchmark={selectedTimeSubMaxForNew?.benchmark || null}
        targetTimeSubMax={selectedTimeSubMaxForNew?.timeSubMax || null}
        template={selectedTimeSubMaxForNew?.template || null}
        loading={loading}
      />

      <CreateNewDistanceSubMaxModal
        opened={Boolean(selectedDistanceSubMaxForNew)}
        onClose={closeModals}
        onCreate={handleCreateBenchmark}
        oldBenchmark={selectedDistanceSubMaxForNew?.benchmark || null}
        targetDistanceSubMax={selectedDistanceSubMaxForNew?.distanceSubMax || null}
        template={selectedDistanceSubMaxForNew?.template || null}
        loading={loading}
      />
    </Container>
  );
};