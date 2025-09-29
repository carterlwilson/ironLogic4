import { Table, Skeleton, Stack, Group, Text, Pagination, Select } from '@mantine/core';
import type { User } from '@ironlogic4/shared/types/users';
import { UserRow } from './UserRow';
import { EmptyState } from './EmptyState';

interface UserTableProps {
  users: User[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  hasFilters: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onAddUser?: () => void;
  onClearFilters?: () => void;
}

const pageSizeOptions = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
];

export function UserTable({
  users,
  loading,
  pagination,
  hasFilters,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
  onAddUser,
  onClearFilters,
}: UserTableProps) {
  // Show skeleton loading state
  if (loading) {
    return (
      <Stack gap="md">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
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
                  <Skeleton height={20} width={60} />
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

  // Show empty state if no users
  if (users.length === 0) {
    return (
      <EmptyState
        hasFilters={hasFilters}
        onAddUser={onAddUser}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <Stack gap="md">
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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