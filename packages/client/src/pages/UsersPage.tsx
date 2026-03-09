import { Container, Title, Text, Stack, Group, Notification } from '@mantine/core';
import { IconUsers, IconCheck, IconX } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import React, { useState } from 'react';
import type { User } from '@ironlogic4/shared/types/users';
import { useUserManagement } from '../hooks/useUserManagement';
import { useUserSearch } from '../hooks/useUserSearch';
import { useGymOptions } from '../hooks/useGymOptions';
import { UserToolbar } from '../components/admin/UserManagement/UserToolbar';
import { UserTable } from '../components/admin/UserManagement/UserTable';
import { AddUserModal } from '../components/admin/UserManagement/AddUserModal';
import { EditUserModal } from '../components/admin/UserManagement/EditUserModal';
import { DeleteUserModal } from '../components/admin/UserManagement/DeleteUserModal';

export function UsersPage() {
  const { user } = useAuth();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Redirect non-admin users
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const {
    users,
    loading,
    pagination,
    isAddModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedUser,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    createUser,
    updateUser,
    deleteUser,
    loadUsers,
  } = useUserManagement();

  const {
    searchQuery,
    roleFilter,
    hasFilters,
    setSearchQuery,
    setRoleFilter,
    clearFilters,
    setPage,
    setPageSize,
    queryParams,
  } = useUserSearch();

  // Load gym options for user modals
  const { gymOptions, loading: gymsLoading } = useGymOptions();

  // Use the search parameters to fetch users
  React.useEffect(() => {
    loadUsers(queryParams);
  }, [queryParams]);

  const handleCreateUser = async (data: any) => {
    try {
      await createUser(data);
      setNotification({ type: 'success', message: 'User created successfully!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to create user. Please try again.' });
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      await updateUser(userId, data);
      setNotification({ type: 'success', message: 'User updated successfully!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update user. Please try again.' });
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    try {
      await deleteUser(userToDelete.id);
      setNotification({ type: 'success', message: 'User deleted successfully!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to delete user. Please try again.' });
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
          <IconUsers size={32} color="#22c55e" />
          <Title order={1}>Users Management</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Manage user accounts and permissions for your organization.
        </Text>

        {/* Toolbar */}
        <UserToolbar
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          hasFilters={hasFilters}
          onSearchChange={setSearchQuery}
          onRoleFilterChange={setRoleFilter}
          onClearFilters={clearFilters}
          onAddUser={openAddModal}
        />

        {/* User Table */}
        <UserTable
          users={users}
          loading={loading}
          pagination={pagination}
          hasFilters={hasFilters}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onAddUser={openAddModal}
          onClearFilters={clearFilters}
        />

        {/* Modals */}
        <AddUserModal
          opened={isAddModalOpen}
          onClose={closeModals}
          onSubmit={handleCreateUser}
          loading={loading}
          gymOptions={gymOptions}
          gymsLoading={gymsLoading}
        />

        <EditUserModal
          opened={isEditModalOpen}
          onClose={closeModals}
          user={selectedUser}
          onSubmit={handleUpdateUser}
          onDelete={openDeleteModal}
          loading={loading}
          gymOptions={gymOptions}
          gymsLoading={gymsLoading}
        />

        <DeleteUserModal
          opened={isDeleteModalOpen}
          onClose={closeModals}
          user={selectedUser}
          onConfirm={handleDeleteUser}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}