import { Table, Skeleton, Stack, Group, Text, Pagination, Select } from '@mantine/core';
import type { Gym } from '@ironlogic4/shared/types/gyms';
import type { OwnerMapping } from '../../../hooks/useOwnerMapping';
import { GymRow } from './GymRow';
import { GymEmptyState } from './GymEmptyState';

interface GymTableProps {
  gyms: Gym[];
  ownerMapping: OwnerMapping;
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  hasFilters: boolean;
  onEdit: (gym: Gym) => void;
  onDelete: (gym: Gym) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onAddGym?: () => void;
  onClearFilters?: () => void;
}

const pageSizeOptions = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
];

export function GymTable({
  gyms,
  ownerMapping,
  loading,
  pagination,
  hasFilters,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
  onAddGym,
  onClearFilters,
}: GymTableProps) {
  // Show skeleton loading state
  if (loading) {
    return (
      <Stack gap="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Address</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Owner</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Array.from({ length: 10 }).map((_, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Skeleton height={16} width="60%" />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={16} width="80%" />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={16} width="70%" />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={16} width="60%" />
                </Table.Td>
                <Table.Td>
                  <Skeleton height={16} width="70%" />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Skeleton height={28} width={28} />
                    <Skeleton height={28} width={28} />
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    );
  }

  // Show empty state if no gyms
  if (gyms.length === 0) {
    return (
      <GymEmptyState
        hasFilters={hasFilters}
        onAddGym={onAddGym}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <Stack gap="md">
      <Table.ScrollContainer minWidth={900}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Address</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Owner</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {gyms.map((gym) => (
              <GymRow
                key={gym.id}
                gym={gym}
                ownerMapping={ownerMapping}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {pagination && pagination.totalPages > 1 && (
        <Stack gap="md" align="center">
          <Group justify="space-between" w="100%">
            <Text size="sm" c="dimmed">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} gyms
            </Text>

            <Select
              value={String(pagination.limit)}
              onChange={(value) => onPageSizeChange(Number(value))}
              data={pageSizeOptions}
              w={140}
            />
          </Group>

          <Pagination
            total={pagination.totalPages}
            value={pagination.page}
            onChange={onPageChange}
            size="sm"
          />
        </Stack>
      )}
    </Stack>
  );
}