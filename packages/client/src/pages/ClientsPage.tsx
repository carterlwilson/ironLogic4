import { Container, Title, Text, Stack, Group } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import React from 'react';
import type { User } from '@ironlogic4/shared/types/users';
import { useClientManagement } from '../hooks/useClientManagement';
import { useClientSearch } from '../hooks/useClientSearch';
import { ClientToolbar } from '../components/clients/ClientToolbar';
import { ClientTable } from '../components/clients/ClientTable';
import { AddClientModal } from '../components/clients/AddClientModal';
import { EditClientModal } from '../components/clients/EditClientModal';
import { DeleteClientModal } from '../components/clients/DeleteClientModal';

export function ClientsPage() {
  const { user } = useAuth();

  // Only owners and coaches can access
  if (user?.role !== 'owner' && user?.role !== 'coach') {
    return <Navigate to="/dashboard" replace />;
  }

  const {
    clients,
    loading,
    pagination,
    isAddModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedClient,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    createClient,
    updateClient,
    deleteClient,
    assignProgram,
    unassignProgram,
    loadClients,
  } = useClientManagement();

  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    resetSearch,
  } = useClientSearch();

  // Load clients when search params change
  React.useEffect(() => {
    if (user?.gymId) {
      loadClients({
        search: searchQuery,
        page: currentPage,
        limit: pageSize,
        gymId: user.gymId,
      });
    }
  }, [searchQuery, currentPage, pageSize, user?.gymId]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleDeleteClient = async (client: User) => {
    await deleteClient(client.id);
  };

  const hasFilters = searchQuery.length > 0;

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group gap="sm">
          <IconUsers size={32} color="#22c55e" />
          <Title order={1}>Client Management</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Manage your clients and their benchmark records.
        </Text>

        <ClientToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClient={openAddModal}
        />

        <ClientTable
          clients={clients}
          loading={loading}
          pagination={pagination}
          hasFilters={hasFilters}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onAddClient={openAddModal}
          onClearFilters={resetSearch}
        />

        <AddClientModal
          opened={isAddModalOpen}
          onClose={closeModals}
          onSubmit={createClient}
          loading={loading}
          gymId={user?.gymId || ''}
        />

        <EditClientModal
          opened={isEditModalOpen}
          onClose={closeModals}
          client={selectedClient}
          onSubmit={updateClient}
          onAssignProgram={assignProgram}
          onUnassignProgram={unassignProgram}
          loading={loading}
        />

        <DeleteClientModal
          opened={isDeleteModalOpen}
          onClose={closeModals}
          client={selectedClient}
          onConfirm={handleDeleteClient}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}