import { Table, Stack, Paper, Text } from '@mantine/core';
import { IconBarbell } from '@tabler/icons-react';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { ClientBenchmarkRow } from './ClientBenchmarkRow';

interface ClientBenchmarkTableProps {
  benchmarks: ClientBenchmark[];
  onEdit: (benchmark: ClientBenchmark) => void;
  onDelete: (benchmark: ClientBenchmark) => void;
  onMove: (benchmark: ClientBenchmark) => void;
  emptyMessage?: string;
}

export function ClientBenchmarkTable({
  benchmarks,
  onEdit,
  onDelete,
  onMove,
  emptyMessage = 'No benchmarks found',
}: ClientBenchmarkTableProps) {
  if (benchmarks.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="lg">
          <IconBarbell size={64} color="gray" />
          <Text size="lg" c="dimmed">
            {emptyMessage}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Measurement</Table.Th>
            <Table.Th>Recorded Date</Table.Th>
            <Table.Th>Tags</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {benchmarks.map((benchmark) => (
            <ClientBenchmarkRow
              key={benchmark.id}
              benchmark={benchmark}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}