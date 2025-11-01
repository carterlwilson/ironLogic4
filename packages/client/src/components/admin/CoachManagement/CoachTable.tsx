import { Table, Paper, Group, Pagination, Select, Skeleton, Stack, Text } from '@mantine/core';
import type { CoachResponse } from '@ironlogic4/shared/types/coaches';
import { CoachRow } from './CoachRow';
import { CoachEmptyState } from './CoachEmptyState';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CoachTableProps {
  coaches: CoachResponse[];
  loading: boolean;
  pagination: PaginationData | null;
  hasFilters: boolean;
  isAdmin: boolean;
  gymMap?: Map<string, string>;
  onEdit: (coach: CoachResponse) => void;
  onDelete: (coach: CoachResponse) => void;
  onResetPassword: (coach: CoachResponse) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onAddCoach: () => void;
  onClearFilters: () => void;
}

const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
];

export function CoachTable({
  coaches,
  loading,
  pagination,
  hasFilters,
  isAdmin,
  gymMap,
  onEdit,
  onDelete,
  onResetPassword,
  onPageChange,
  onPageSizeChange,
  onAddCoach,
  onClearFilters,
}: CoachTableProps) {
  // Loading state
  if (loading && coaches.length === 0) {
    return (
      <Paper withBorder p="md">
        <Stack gap="md">
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </Stack>
      </Paper>
    );
  }

  // Empty state
  if (!loading && coaches.length === 0) {
    return (
      <Paper withBorder p="xl">
        <CoachEmptyState
          hasFilters={hasFilters}
          onAddCoach={onAddCoach}
          onClearFilters={onClearFilters}
        />
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              {isAdmin && <Table.Th>Gym</Table.Th>}
              <Table.Th>Created</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {coaches.map((coach) => (
              <CoachRow
                key={coach.id}
                coach={coach}
                isAdmin={isAdmin}
                gymName={gymMap?.get(coach.gymId || '')}
                onEdit={onEdit}
                onDelete={onDelete}
                onResetPassword={onResetPassword}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} coaches
            </Text>
            <Select
              data={PAGE_SIZE_OPTIONS}
              value={String(pagination.limit)}
              onChange={(value) => onPageSizeChange(parseInt(value || '10', 10))}
              style={{ width: 150 }}
            />
          </Group>

          <Pagination
            total={pagination.totalPages}
            value={pagination.page}
            onChange={onPageChange}
          />
        </Group>
      )}
    </Stack>
  );
}