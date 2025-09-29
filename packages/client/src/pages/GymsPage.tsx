import { Container, Title, Text, Stack, Group, Notification } from '@mantine/core';
import { IconBuilding, IconCheck, IconX } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import React, { useState } from 'react';
import type { Gym } from '@ironlogic4/shared/types/gyms';
import { useGymManagement } from '../hooks/useGymManagement';
import { useGymSearch } from '../hooks/useGymSearch';
import { useOwnerMapping } from '../hooks/useOwnerMapping';
import { GymToolbar } from '../components/admin/GymManagement/GymToolbar';
import { GymTable } from '../components/admin/GymManagement/GymTable';
import { AddGymModal } from '../components/admin/GymManagement/AddGymModal';
import { EditGymModal } from '../components/admin/GymManagement/EditGymModal';
import { DeleteGymModal } from '../components/admin/GymManagement/DeleteGymModal';

export function GymsPage() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Redirect non-admin users
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const {
    gyms,
    loading,
    pagination,
    isAddModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedGym,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    createGym,
    updateGym,
    deleteGym,
    loadGyms,
  } = useGymManagement();

  const {
    searchQuery,
    ownerFilter,
    hasFilters,
    setSearchQuery,
    setOwnerFilter,
    clearFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
    queryParams,
  } = useGymSearch();

  // Owner mapping for efficient owner name lookups
  const {
    ownerMapping,
    ownerOptions,
    loading: ownersLoading,
  } = useOwnerMapping();

  // Use the search parameters to fetch gyms
  React.useEffect(() => {
    loadGyms(queryParams);
  }, [searchQuery, ownerFilter, page, pageSize]);

  const handleCreateGym = async (data: any) => {
    try {
      await createGym(data);
      setNotification({ type: 'success', message: 'Gym created successfully!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to create gym. Please try again.' });
    }
  };

  const handleUpdateGym = async (gymId: string, data: any) => {
    try {
      await updateGym(gymId, data);
      setNotification({ type: 'success', message: 'Gym updated successfully!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update gym. Please try again.' });
    }
  };

  const handleDeleteGym = async (gymToDelete: Gym) => {
    try {
      await deleteGym(gymToDelete.id);
      setNotification({ type: 'success', message: 'Gym deleted successfully!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to delete gym. Please try again.' });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Notification */}
        {notification && (
          <Notification
            icon={notification.type === 'success' ? <IconCheck size={18} /> : <IconX size={18} />}
            color={notification.type === 'success' ? 'green' : 'red'}
            title={notification.type === 'success' ? 'Success' : 'Error'}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Notification>
        )}

        {/* Page Header */}
        <Group gap="sm">
          <IconBuilding size={32} color="#22c55e" />
          <Title order={1}>Gyms Management</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Manage gym locations and their associated owners.
        </Text>

        {/* Toolbar */}
        <GymToolbar
          searchQuery={searchQuery}
          ownerFilter={ownerFilter}
          hasFilters={hasFilters}
          ownerOptions={ownerOptions}
          ownersLoading={ownersLoading}
          onSearchChange={setSearchQuery}
          onOwnerFilterChange={setOwnerFilter}
          onClearFilters={clearFilters}
          onAddGym={openAddModal}
        />

        {/* Gym Table */}
        <GymTable
          gyms={gyms}
          ownerMapping={ownerMapping}
          loading={loading}
          pagination={pagination}
          hasFilters={hasFilters}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onAddGym={openAddModal}
          onClearFilters={clearFilters}
        />

        {/* Modals */}
        <AddGymModal
          opened={isAddModalOpen}
          onClose={closeModals}
          onSubmit={handleCreateGym}
          loading={loading}
        />

        <EditGymModal
          opened={isEditModalOpen}
          onClose={closeModals}
          gym={selectedGym}
          onSubmit={handleUpdateGym}
          onDelete={openDeleteModal}
          loading={loading}
        />

        <DeleteGymModal
          opened={isDeleteModalOpen}
          onClose={closeModals}
          gym={selectedGym}
          onConfirm={handleDeleteGym}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}