import { Container, Title, Text, Stack, Group, Button, Tabs, Loader } from '@mantine/core';
import { IconBarbell, IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import type { User } from '@ironlogic4/shared/types/users';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { clientApi } from '../services/clientApi';
import { useBenchmarkTemplates } from '../hooks/useBenchmarkTemplates';
import { ClientBenchmarkTable } from '../components/clientBenchmarks/ClientBenchmarkTable';
import { CreateBenchmarkFromTemplateModal } from '../components/clientBenchmarks/CreateBenchmarkFromTemplateModal';
import { EditBenchmarkModal } from '../components/clientBenchmarks/EditBenchmarkModal';
import { MoveBenchmarkModal } from '../components/clientBenchmarks/MoveBenchmarkModal';
import { DeleteBenchmarkModal } from '../components/clientBenchmarks/DeleteBenchmarkModal';

export function ClientBenchmarksPage() {
  const { user } = useAuth();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('current');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<ClientBenchmark | null>(null);
  const [isCurrentBenchmark, setIsCurrentBenchmark] = useState(true);

  // Load benchmark templates
  const { templates, loading: templatesLoading } = useBenchmarkTemplates(user?.gymId);

  // Only owners and coaches can access
  if (user?.role !== 'owner' && user?.role !== 'coach') {
    return <Navigate to="/dashboard" replace />;
  }

  // Load client data
  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    if (!clientId) return;

    setLoading(true);
    try {
      const response = await clientApi.getClientById(clientId);
      setClient(response.data || null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load client';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBenchmark = async (
    benchmarkData: Omit<ClientBenchmark, 'id' | 'createdAt' | 'updatedAt'>,
    isHistorical: boolean
  ) => {
    if (!client) return;

    try {
      const newBenchmark: ClientBenchmark = {
        ...benchmarkData,
        id: Date.now().toString(), // Temporary ID, server will replace
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Determine which array to update based on isHistorical
      const updatePayload = isHistorical
        ? {
            historicalBenchmarks: [
              ...(client.historicalBenchmarks || []),
              newBenchmark,
            ],
          }
        : {
            currentBenchmarks: [
              ...(client.currentBenchmarks || []),
              newBenchmark,
            ],
          };

      await clientApi.updateClient(client.id, updatePayload);

      notifications.show({
        title: 'Success',
        message: `Benchmark added to ${isHistorical ? 'historical' : 'current'} benchmarks`,
        color: 'green',
        autoClose: 3000,
      });

      await loadClient();
      setIsCreateModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add benchmark';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  };

  const handleEditBenchmark = async (updatedBenchmark: ClientBenchmark) => {
    if (!client) return;

    try {
      let updatedCurrent = client.currentBenchmarks || [];
      let updatedHistorical = client.historicalBenchmarks || [];

      if (isCurrentBenchmark) {
        updatedCurrent = updatedCurrent.map((b) =>
          b.id === updatedBenchmark.id ? updatedBenchmark : b
        );
      } else {
        updatedHistorical = updatedHistorical.map((b) =>
          b.id === updatedBenchmark.id ? updatedBenchmark : b
        );
      }

      await clientApi.updateClient(client.id, {
        currentBenchmarks: updatedCurrent,
        historicalBenchmarks: updatedHistorical,
      });

      notifications.show({
        title: 'Success',
        message: 'Benchmark updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadClient();
      setIsEditModalOpen(false);
      setSelectedBenchmark(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update benchmark';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  };

  const handleMoveBenchmark = async (benchmark: ClientBenchmark, moveToHistorical: boolean) => {
    if (!client) return;

    try {
      let updatedCurrent = client.currentBenchmarks || [];
      let updatedHistorical = client.historicalBenchmarks || [];

      if (moveToHistorical) {
        updatedCurrent = updatedCurrent.filter((b) => b.id !== benchmark.id);
        updatedHistorical = [...updatedHistorical, benchmark];
      } else {
        updatedHistorical = updatedHistorical.filter((b) => b.id !== benchmark.id);
        updatedCurrent = [...updatedCurrent, benchmark];
      }

      await clientApi.updateClient(client.id, {
        currentBenchmarks: updatedCurrent,
        historicalBenchmarks: updatedHistorical,
      });

      notifications.show({
        title: 'Success',
        message: `Benchmark moved to ${moveToHistorical ? 'historical' : 'current'}`,
        color: 'green',
        autoClose: 3000,
      });

      await loadClient();
      setIsMoveModalOpen(false);
      setSelectedBenchmark(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move benchmark';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  };

  const handleDeleteBenchmark = async (benchmark: ClientBenchmark) => {
    if (!client) return;

    try {
      let updatedCurrent = client.currentBenchmarks || [];
      let updatedHistorical = client.historicalBenchmarks || [];

      if (isCurrentBenchmark) {
        updatedCurrent = updatedCurrent.filter((b) => b.id !== benchmark.id);
      } else {
        updatedHistorical = updatedHistorical.filter((b) => b.id !== benchmark.id);
      }

      await clientApi.updateClient(client.id, {
        currentBenchmarks: updatedCurrent,
        historicalBenchmarks: updatedHistorical,
      });

      notifications.show({
        title: 'Success',
        message: 'Benchmark deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadClient();
      setIsDeleteModalOpen(false);
      setSelectedBenchmark(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete benchmark';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  };

  const openEditModal = (benchmark: ClientBenchmark) => {
    setSelectedBenchmark(benchmark);
    setIsCurrentBenchmark(activeTab === 'current');
    setIsEditModalOpen(true);
  };

  const openMoveModal = (benchmark: ClientBenchmark) => {
    setSelectedBenchmark(benchmark);
    setIsCurrentBenchmark(activeTab === 'current');
    setIsMoveModalOpen(true);
  };

  const openDeleteModal = (benchmark: ClientBenchmark) => {
    setSelectedBenchmark(benchmark);
    setIsCurrentBenchmark(activeTab === 'current');
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="lg">
          <Loader size="lg" />
          <Text>Loading client...</Text>
        </Stack>
      </Container>
    );
  }

  if (!client) {
    return (
      <Container size="xl" py="xl">
        <Text>Client not found</Text>
      </Container>
    );
  }

  const currentBenchmarks = client.currentBenchmarks || [];
  const historicalBenchmarks = client.historicalBenchmarks || [];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <Group gap="sm">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/clients')}
            >
              Back to Clients
            </Button>
          </Group>
        </Group>

        <Group gap="sm">
          <IconBarbell size={32} color="#22c55e" />
          <div>
            <Title order={1}>
              {client.firstName} {client.lastName}
            </Title>
            <Text size="sm" c="dimmed">
              {client.email}
            </Text>
          </div>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Group justify="space-between" mb="md">
            <Tabs.List>
              <Tabs.Tab value="current">
                Current Benchmarks ({currentBenchmarks.length})
              </Tabs.Tab>
              <Tabs.Tab value="historical">
                Historical Benchmarks ({historicalBenchmarks.length})
              </Tabs.Tab>
            </Tabs.List>

            {activeTab === 'current' && (
              <Button
                leftSection={<IconPlus size={16} />}
                color="green"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Add Benchmark
              </Button>
            )}
          </Group>

          <Tabs.Panel value="current">
            <ClientBenchmarkTable
              benchmarks={currentBenchmarks}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onMove={openMoveModal}
              emptyMessage="No current benchmarks. Add one to get started!"
            />
          </Tabs.Panel>

          <Tabs.Panel value="historical">
            <ClientBenchmarkTable
              benchmarks={historicalBenchmarks}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onMove={openMoveModal}
              emptyMessage="No historical benchmarks yet."
            />
          </Tabs.Panel>
        </Tabs>

        {/* Modals */}
        <CreateBenchmarkFromTemplateModal
          opened={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          templates={templates}
          onSubmit={handleCreateBenchmark}
          loading={loading || templatesLoading}
        />

        <EditBenchmarkModal
          opened={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBenchmark(null);
          }}
          benchmark={selectedBenchmark}
          onSubmit={handleEditBenchmark}
          loading={loading}
        />

        <MoveBenchmarkModal
          opened={isMoveModalOpen}
          onClose={() => {
            setIsMoveModalOpen(false);
            setSelectedBenchmark(null);
          }}
          benchmark={selectedBenchmark}
          isCurrentlyInCurrent={isCurrentBenchmark}
          onConfirm={handleMoveBenchmark}
          loading={loading}
        />

        <DeleteBenchmarkModal
          opened={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedBenchmark(null);
          }}
          benchmark={selectedBenchmark}
          onConfirm={handleDeleteBenchmark}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}