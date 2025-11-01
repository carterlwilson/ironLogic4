import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Stack,
  Title,
  Tabs,
  Button,
  Group,
  Menu,
  Text,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { IconPlus, IconRefresh, IconChevronDown } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { useMyBenchmarks } from '../hooks/useMyBenchmarks';
import { useBenchmarkTemplates } from '../hooks/useBenchmarkTemplates';
import { MyBenchmarkTable } from '../components/benchmarks/MyBenchmarkTable';
import { BenchmarkFilters } from '../components/benchmarks/BenchmarkFilters';
import { CreateBenchmarkModal } from '../components/benchmarks/CreateBenchmarkModal';
import { EditBenchmarkModal } from '../components/benchmarks/EditBenchmarkModal';
import { CreateNewFromOldModal } from '../components/benchmarks/CreateNewFromOldModal';
import {
  filterBenchmarksBySearch,
  filterBenchmarksByTags,
  sortBenchmarksByDate,
  sortBenchmarksByName,
  sortBenchmarksByType,
  getAllUniqueTags,
} from '../utils/benchmarkUtils';

type SortOption = 'name' | 'date' | 'type';

export function MyBenchmarksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('active');

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date');

  // Hooks
  const {
    currentBenchmarks,
    historicalBenchmarks,
    loading,
    isCreateModalOpen,
    isEditModalOpen,
    isCreateNewFromOldModalOpen,
    selectedBenchmark,
    selectedTemplate,
    loadBenchmarks,
    createBenchmark,
    updateBenchmark,
    createNewFromOld,
    openCreateModal,
    openEditModal,
    openCreateNewFromOldModal,
    closeModals,
  } = useMyBenchmarks();

  const { templates, loading: templatesLoading } = useBenchmarkTemplates(user?.gymId);

  // Load benchmarks on mount
  useEffect(() => {
    loadBenchmarks();
  }, [loadBenchmarks]);

  // Get all unique tags from all benchmarks
  const allTags = useMemo(() => {
    const allBenchmarks = [...currentBenchmarks, ...historicalBenchmarks];
    return getAllUniqueTags(allBenchmarks);
  }, [currentBenchmarks, historicalBenchmarks]);

  // Filter and sort current benchmarks
  const filteredCurrentBenchmarks = useMemo(() => {
    let filtered = filterBenchmarksBySearch(currentBenchmarks, searchTerm);
    filtered = filterBenchmarksByTags(filtered, selectedTags);

    switch (sortBy) {
      case 'name':
        return sortBenchmarksByName(filtered, true);
      case 'date':
        return sortBenchmarksByDate(filtered, false);
      case 'type':
        return sortBenchmarksByType(filtered, true);
      default:
        return filtered;
    }
  }, [currentBenchmarks, searchTerm, selectedTags, sortBy]);

  // Filter and sort historical benchmarks
  const filteredHistoricalBenchmarks = useMemo(() => {
    let filtered = filterBenchmarksBySearch(historicalBenchmarks, searchTerm);
    filtered = filterBenchmarksByTags(filtered, selectedTags);

    switch (sortBy) {
      case 'name':
        return sortBenchmarksByName(filtered, true);
      case 'date':
        return sortBenchmarksByDate(filtered, false);
      case 'type':
        return sortBenchmarksByType(filtered, true);
      default:
        return filtered;
    }
  }, [historicalBenchmarks, searchTerm, selectedTags, sortBy]);

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>My Benchmarks</Title>
            <Text size="sm" c="dimmed" mt={4}>
              Track your progress and personal records
            </Text>
          </div>

          <Group>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => loadBenchmarks()}
              loading={loading}
            >
              <IconRefresh size={20} />
            </ActionIcon>

            <Menu position="bottom-end" width={200}>
              <Menu.Target>
                <Button
                  leftSection={<IconPlus size={16} />}
                  rightSection={<IconChevronDown size={16} />}
                  disabled={templates.length === 0}
                  loading={templatesLoading}
                >
                  Create Benchmark
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Select a benchmark type</Menu.Label>
                {templates.length === 0 ? (
                  <Menu.Item disabled>
                    <Text size="sm" c="dimmed">
                      No templates available
                    </Text>
                  </Menu.Item>
                ) : (
                  templates.map((template) => (
                    <Menu.Item
                      key={template.id}
                      onClick={() => openCreateModal(template)}
                    >
                      <Group justify="space-between" gap="xs">
                        <Text size="sm">{template.name}</Text>
                        <Badge size="xs" variant="light">
                          {template.type}
                        </Badge>
                      </Group>
                    </Menu.Item>
                  ))
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Filters */}
        <BenchmarkFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          availableTags={allTags}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="active">
              Active Benchmarks
              <Badge size="sm" ml="xs" variant="filled">
                {filteredCurrentBenchmarks.length}
              </Badge>
            </Tabs.Tab>
            <Tabs.Tab value="historical">
              Historical
              <Badge size="sm" ml="xs" variant="filled" color="gray">
                {filteredHistoricalBenchmarks.length}
              </Badge>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="active" pt="md">
            <MyBenchmarkTable
              benchmarks={filteredCurrentBenchmarks}
              isHistorical={false}
              loading={loading}
              onEdit={openEditModal}
              onCreateNew={openCreateNewFromOldModal}
            />
          </Tabs.Panel>

          <Tabs.Panel value="historical" pt="md">
            <MyBenchmarkTable
              benchmarks={filteredHistoricalBenchmarks}
              isHistorical={true}
              loading={loading}
              onCreateNew={openCreateNewFromOldModal}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Modals */}
      <CreateBenchmarkModal
        opened={isCreateModalOpen}
        onClose={closeModals}
        template={selectedTemplate}
        onCreate={createBenchmark}
      />

      <EditBenchmarkModal
        opened={isEditModalOpen}
        onClose={closeModals}
        benchmark={selectedBenchmark}
        onUpdate={updateBenchmark}
      />

      <CreateNewFromOldModal
        opened={isCreateNewFromOldModalOpen}
        onClose={closeModals}
        oldBenchmark={selectedBenchmark}
        onCreate={createNewFromOld}
      />
    </Container>
  );
}