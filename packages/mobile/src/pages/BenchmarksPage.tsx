import { Container, Title, Text, Stack, Tabs, ActionIcon, Group } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { useBenchmarks } from '../hooks/useBenchmarks';
import { BenchmarkList } from '../components/benchmarks/BenchmarkList';
import { BenchmarkProgressList } from '../components/benchmarks/BenchmarkProgressList';
import { CreateBenchmarkModal } from '../components/benchmarks/CreateBenchmarkModal';
import { EditBenchmarkModal } from '../components/benchmarks/EditBenchmarkModal';
import { CreateNewFromOldModal } from '../components/benchmarks/CreateNewFromOldModal';

export const BenchmarksPage = () => {
  const {
    currentBenchmarks,
    historicalBenchmarks,
    templates,
    loading,
    isCreateOpen,
    isEditOpen,
    isCreateNewFromOldOpen,
    selectedBenchmark,
    loadBenchmarks,
    handleCreateBenchmark,
    handleUpdateBenchmark,
    openCreate,
    openEdit,
    openCreateNewFromOld,
    closeModals,
  } = useBenchmarks();

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

        {/* Tabs */}
        <Tabs defaultValue="current" variant="pills">
          <Tabs.List grow mb="md">
            <Tabs.Tab value="current">
              Current ({currentBenchmarks.length})
            </Tabs.Tab>
            <Tabs.Tab value="historical">
              Historical ({historicalBenchmarks.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="current">
            <BenchmarkList
              benchmarks={currentBenchmarks}
              isHistorical={false}
              loading={loading}
              onEdit={openEdit}
              onCreateNew={openCreateNewFromOld}
            />
          </Tabs.Panel>

          <Tabs.Panel value="historical">
            <BenchmarkProgressList currentBenchmarks={currentBenchmarks} />
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