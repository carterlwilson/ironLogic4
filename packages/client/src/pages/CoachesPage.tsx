import { Container, Title, Text, Stack, Group } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import React from 'react';
import type { CoachResponse, CreateCoachRequest, UpdateCoachRequest, ResetCoachPasswordRequest } from '@ironlogic4/shared/types/coaches';
import { useCoachManagement } from '../hooks/useCoachManagement';
import { useCoachSearch } from '../hooks/useCoachSearch';
import { useGyms } from '../hooks/useGyms';
import {
  CoachToolbar,
  CoachTable,
  AddCoachModal,
  EditCoachModal,
  DeleteCoachModal,
  ResetPasswordModal,
  PasswordDisplayModal,
} from '../components/admin/CoachManagement';

export function CoachesPage() {
  const { user } = useAuth();

  // Redirect users who are not admin or owner
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <Navigate to="/dashboard" replace />;
  }

  const isAdmin = user.role === 'admin';
  const gymId = user.gymId || '';

  // Fetch gyms for admin users only
  const { gymOptions, gymMap, loading: gymsLoading } = useGyms(isAdmin);

  // Coach Management
  const {
    coaches,
    loading: coachesLoading,
    pagination,
    isAddModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    isResetPasswordModalOpen,
    isPasswordDisplayModalOpen,
    selectedCoach,
    temporaryPassword,
    openAddModal,
    openEditModal,
    openDeleteModal,
    openResetPasswordModal,
    closeModals,
    closePasswordDisplayModal,
    createCoach,
    updateCoach,
    deleteCoach,
    resetPassword,
    loadCoaches,
  } = useCoachManagement();

  // Search and Filters
  const {
    searchQuery,
    gymId: selectedGymId,
    hasFilters,
    setSearchQuery,
    setGymId,
    clearFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
    queryParams,
  } = useCoachSearch();

  // Load coaches when filters change
  React.useEffect(() => {
    if (isAdmin) {
      // Admin can see all coaches, optionally filtered by gym
      loadCoaches(queryParams);
    } else {
      // Owner can only see coaches from their gym
      loadCoaches({ ...queryParams, gymId });
    }
  }, [searchQuery, selectedGymId, page, pageSize, gymId, isAdmin]);

  const handleCreateCoach = async (data: CreateCoachRequest) => {
    await createCoach(data);
  };

  const handleUpdateCoach = async (coachId: string, data: UpdateCoachRequest) => {
    await updateCoach(coachId, data);
  };

  const handleDeleteCoach = async (coach: CoachResponse) => {
    await deleteCoach(coach.id);
  };

  const handleResetPassword = async (coachId: string, data: ResetCoachPasswordRequest) => {
    await resetPassword(coachId, data);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Page Header */}
        <Group gap="sm">
          <IconUsers size={32} color="#22c55e" />
          <Title order={1}>Coach Management</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Manage coaches for your gym. Coaches can manage clients and programs.
        </Text>

        {/* Toolbar */}
        <CoachToolbar
          searchQuery={searchQuery}
          gymId={selectedGymId}
          hasFilters={hasFilters}
          isAdmin={isAdmin}
          onSearchChange={setSearchQuery}
          onGymChange={isAdmin ? setGymId : undefined}
          onClearFilters={clearFilters}
          onAddCoach={openAddModal}
          gymOptions={gymOptions}
          gymsLoading={gymsLoading}
        />

        {/* Coach Table */}
        <CoachTable
          coaches={coaches}
          loading={coachesLoading}
          pagination={pagination}
          hasFilters={hasFilters}
          isAdmin={isAdmin}
          gymMap={gymMap}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onResetPassword={openResetPasswordModal}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onAddCoach={openAddModal}
          onClearFilters={clearFilters}
        />

        {/* Add Coach Modal */}
        <AddCoachModal
          opened={isAddModalOpen}
          onClose={closeModals}
          onSubmit={handleCreateCoach}
          loading={coachesLoading}
          isAdmin={isAdmin}
          gymId={gymId}
          gymOptions={gymOptions}
          gymsLoading={gymsLoading}
        />

        {/* Edit Coach Modal */}
        <EditCoachModal
          opened={isEditModalOpen}
          onClose={closeModals}
          coach={selectedCoach}
          onSubmit={handleUpdateCoach}
          onDelete={openDeleteModal}
          loading={coachesLoading}
        />

        {/* Delete Coach Modal */}
        <DeleteCoachModal
          opened={isDeleteModalOpen}
          onClose={closeModals}
          coach={selectedCoach}
          onConfirm={handleDeleteCoach}
          loading={coachesLoading}
        />

        {/* Reset Password Modal */}
        <ResetPasswordModal
          opened={isResetPasswordModalOpen}
          onClose={closeModals}
          coach={selectedCoach}
          onConfirm={handleResetPassword}
          loading={coachesLoading}
        />

        {/* Password Display Modal */}
        <PasswordDisplayModal
          opened={isPasswordDisplayModalOpen}
          onClose={closePasswordDisplayModal}
          temporaryPassword={temporaryPassword}
        />
      </Stack>
    </Container>
  );
}