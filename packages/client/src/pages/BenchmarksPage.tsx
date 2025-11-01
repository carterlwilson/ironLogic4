import { Container, Title, Text, Stack, Group } from '@mantine/core';
import { IconBarbell } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import React from 'react';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import { useBenchmarkTemplateManagement } from '../hooks/useBenchmarkTemplateManagement';
import { useBenchmarkTemplateSearch } from '../hooks/useBenchmarkTemplateSearch';
import { BenchmarkTemplateToolbar } from '../components/benchmarks/BenchmarkTemplateToolbar';
import { BenchmarkTemplateTable } from '../components/benchmarks/BenchmarkTemplateTable';
import { BenchmarkTemplateModal } from '../components/benchmarks/BenchmarkTemplateModal';
import { DeleteBenchmarkTemplateModal } from '../components/benchmarks/DeleteBenchmarkTemplateModal';

export function BenchmarksPage() {
  const { user } = useAuth();

  // Redirect users who are not admin or owner
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Get gymId from user
  const gymId = user.gymId || '';

  // Benchmark Template Management
  const {
    benchmarkTemplates,
    loading,
    pagination,
    isAddModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedBenchmarkTemplate,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    createBenchmarkTemplate,
    updateBenchmarkTemplate,
    deleteBenchmarkTemplate,
    loadBenchmarkTemplates,
  } = useBenchmarkTemplateManagement();

  const {
    searchQuery,
    typeFilter,
    hasFilters,
    setSearchQuery,
    setTypeFilter,
    clearFilters,
    page,
    pageSize,
    setPage,
    setPageSize,
    queryParams,
  } = useBenchmarkTemplateSearch();

  // Load benchmark templates when filters change
  React.useEffect(() => {
    if (gymId) {
      loadBenchmarkTemplates({ ...queryParams, gymId });
    }
  }, [searchQuery, typeFilter, page, pageSize, gymId]);

  const handleCreateTemplate = async (data: any) => {
    await createBenchmarkTemplate(data);
  };

  const handleUpdateTemplate = async (data: any) => {
    if (selectedBenchmarkTemplate) {
      await updateBenchmarkTemplate(selectedBenchmarkTemplate.id, data);
    }
  };

  const handleDeleteTemplate = async (template: BenchmarkTemplate) => {
    await deleteBenchmarkTemplate(template.id);
  };

  const isEditMode = isEditModalOpen && !!selectedBenchmarkTemplate;

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Page Header */}
        <Group gap="sm">
          <IconBarbell size={32} color="#22c55e" />
          <Title order={1}>Benchmark Management</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Manage benchmark templates for tracking client performance.
        </Text>

        {/* Toolbar */}
        <BenchmarkTemplateToolbar
          searchQuery={searchQuery}
          typeFilter={typeFilter}
          hasFilters={hasFilters}
          onSearchChange={setSearchQuery}
          onTypeFilterChange={setTypeFilter}
          onClearFilters={clearFilters}
          onAddTemplate={openAddModal}
        />

        {/* Table */}
        <BenchmarkTemplateTable
          templates={benchmarkTemplates}
          loading={loading}
          pagination={pagination}
          hasFilters={hasFilters}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onAddTemplate={openAddModal}
          onClearFilters={clearFilters}
        />

        {/* Add/Edit Modal */}
        <BenchmarkTemplateModal
          opened={isAddModalOpen || isEditModalOpen}
          onClose={closeModals}
          onSubmit={isEditMode ? handleUpdateTemplate : handleCreateTemplate}
          loading={loading}
          gymId={gymId}
          template={selectedBenchmarkTemplate}
        />

        {/* Delete Modal */}
        <DeleteBenchmarkTemplateModal
          opened={isDeleteModalOpen}
          onClose={closeModals}
          template={selectedBenchmarkTemplate}
          onConfirm={handleDeleteTemplate}
          loading={loading}
        />
      </Stack>
    </Container>
  );
}