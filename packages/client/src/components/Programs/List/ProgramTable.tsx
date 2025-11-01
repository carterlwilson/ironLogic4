import { Table, Paper, Badge, Group, ActionIcon, Text, Pagination, Skeleton, Stack } from '@mantine/core';
import { IconEye, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import type { IProgram } from '@ironlogic4/shared/types/programs';

interface ProgramTableProps {
  programs: IProgram[];
  loading: boolean;
  onDeleteProgram: (program: IProgram) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function ProgramTable({
  programs,
  loading,
  onDeleteProgram,
  pagination,
  onPageChange,
}: ProgramTableProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Paper withBorder p="md">
        <Stack gap="sm">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={50} />
          ))}
        </Stack>
      </Paper>
    );
  }

  if (programs.length === 0) {
    return (
      <Paper withBorder p="xl">
        <Text ta="center" c="dimmed">
          No programs found
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Blocks</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th style={{ width: 120 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {programs.map((program) => (
              <Table.Tr key={program.id}>
                <Table.Td>
                  <Text fw={500}>{program.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {program.description || '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={program.isActive ? 'green' : 'gray'} size="sm">
                    {program.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{program.blocks.length}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {new Date(program.createdAt).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="forestGreen"
                      onClick={() => navigate(`/programs/${program.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onDeleteProgram(program)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {pagination && pagination.totalPages > 1 && (
        <Group justify="center">
          <Pagination
            value={pagination.page}
            onChange={onPageChange}
            total={pagination.totalPages}
          />
        </Group>
      )}
    </Stack>
  );
}