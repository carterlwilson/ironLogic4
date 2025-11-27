import { Container, Title, Text, Stack, Tabs, ActionIcon, Group } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useBenchmarks } from '../hooks/useBenchmarks';
import { BenchmarkList } from '../components/benchmarks/BenchmarkList';
import { BenchmarkProgressList } from '../components/benchmarks/BenchmarkProgressList';
import { CreateBenchmarkModal } from '../components/benchmarks/CreateBenchmarkModal';
import { EditBenchmarkModal } from '../components/benchmarks/EditBenchmarkModal';
import { EditRepMaxModal } from '../components/benchmarks/EditRepMaxModal';
import { CreateNewFromOldModal } from '../components/benchmarks/CreateNewFromOldModal';
import { TagFilter } from '../components/benchmarks/TagFilter';
import { getAllUniqueTags, filterBenchmarksByTag } from '../utils/tagUtils';

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
    isEditRepMaxOpen,
    selectedBenchmark,
    selectedRepMax,
    loadBenchmarks,
    handleCreateBenchmark,
    handleUpdateBenchmark,
    handleUpdateRepMax,
    openCreate,
    openEdit,
    openCreateNewFromOld,
    openEditRepMax,
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
    </Container>
  );
};