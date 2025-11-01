import { useState, useEffect } from 'react';
import { Container, Title, Stack } from '@mantine/core';
import { useProgramList } from '../../hooks/usePrograms';
import { ProgramToolbar } from '../../components/Programs/List/ProgramToolbar';
import { ProgramTable } from '../../components/Programs/List/ProgramTable';
import { ProgramEmptyState } from '../../components/Programs/List/ProgramEmptyState';
import { CreateProgramModal } from '../../components/Programs/List/CreateProgramModal';
import { DeleteProgramModal } from '../../components/Programs/List/DeleteProgramModal';
import type { IProgram, ProgramListParams } from '@ironlogic4/shared/types/programs';

export function ProgramListPage() {
  const [params, setParams] = useState<ProgramListParams>({
    page: 1,
    limit: 10,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<IProgram | null>(null);

  const { data, isLoading, refetch } = useProgramList(params);

  // Load programs on mount
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (filters: Partial<ProgramListParams>) => {
    setParams(prev => ({ ...prev, ...filters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setParams(prev => ({ ...prev, page }));
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleOpenDeleteModal = (program: IProgram) => {
    setSelectedProgram(program);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setSelectedProgram(null);
    setIsDeleteModalOpen(false);
  };

  const programs = data?.data || [];
  const pagination = data?.pagination;

  const showEmptyState = !isLoading && programs.length === 0 && !params.search;

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Title order={1}>Programs</Title>

        <ProgramToolbar
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onCreateProgram={handleOpenCreateModal}
          searchValue={params.search || ''}
          isActiveFilter={params.isActive}
        />

        {showEmptyState ? (
          <ProgramEmptyState onCreateProgram={handleOpenCreateModal} />
        ) : (
          <ProgramTable
            programs={programs}
            loading={isLoading}
            onDeleteProgram={handleOpenDeleteModal}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        )}

        <CreateProgramModal
          opened={isCreateModalOpen}
          onClose={handleCloseCreateModal}
        />

        <DeleteProgramModal
          opened={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          program={selectedProgram}
        />
      </Stack>
    </Container>
  );
}