import { Container, Title, Stack, Tabs, ActionIcon, Group, TextInput } from '@mantine/core';
import { IconPlus, IconRefresh, IconSearch, IconX } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
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
import { ConfirmDeleteBenchmarkModal } from '../components/benchmarks/ConfirmDeleteBenchmarkModal';
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
    isDeleteOpen,
    isDeleting,
    benchmarkToDelete,
    openDelete,
    cancelDelete,
    confirmDelete,
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

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const availableTags = useMemo(
    () => getAllUniqueTags([...currentBenchmarks, ...historicalBenchmarks]),
    [currentBenchmarks, historicalBenchmarks]
  );

  // Auto-clear tag selection when the tag disappears from the data
  const effectiveTag = availableTags.includes(selectedTag!) ? selectedTag : null;

  const filteredCurrentBenchmarks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const byTag = filterBenchmarksByTag(currentBenchmarks, effectiveTag);
    return query ? byTag.filter((b) => b.name.toLowerCase().includes(query)) : byTag;
  }, [currentBenchmarks, effectiveTag, searchQuery]);

  const filteredHistoricalBenchmarks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const byTag = filterBenchmarksByTag(historicalBenchmarks, effectiveTag);
    return query ? byTag.filter((b) => b.name.toLowerCase().includes(query)) : byTag;
  }, [historicalBenchmarks, effectiveTag, searchQuery]);

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

        {/* Search */}
        <TextInput
          placeholder="Search benchmarks..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          rightSection={
            searchQuery ? (
              <ActionIcon variant="transparent" size="sm" onClick={() => setSearchQuery('')}>
                <IconX size={16} />
              </ActionIcon>
            ) : null
          }
        />

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
              onDelete={openDelete}
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

      <ConfirmDeleteBenchmarkModal
        opened={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        benchmarkName={benchmarkToDelete?.name ?? ''}
        loading={isDeleting}
      />
    </Container>
  );
};