import { Table, Stack, Text, Paper } from '@mantine/core';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { MyBenchmarkRow } from './MyBenchmarkRow';

interface MyBenchmarkTableProps {
  benchmarks: ClientBenchmark[];
  isHistorical?: boolean;
  loading?: boolean;
  onEdit?: (benchmark: ClientBenchmark) => void;
  onCreateNew?: (benchmark: ClientBenchmark) => void;
}

export function MyBenchmarkTable({
  benchmarks,
  isHistorical = false,
  loading = false,
  onEdit,
  onCreateNew,
}: MyBenchmarkTableProps) {
  if (loading) {
    return (
      <Paper p="xl" withBorder>
        <Text c="dimmed" ta="center">
          Loading benchmarks...
        </Text>
      </Paper>
    );
  }

  if (benchmarks.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="sm">
          <Text size="lg" fw={500} c="dimmed">
            {isHistorical ? 'No Historical Benchmarks' : 'No Active Benchmarks'}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {isHistorical
              ? 'Benchmarks older than 1 week will appear here.'
              : 'Create your first benchmark to get started.'}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper withBorder style={{ overflow: 'hidden' }}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Tags</Table.Th>
            <Table.Th>Result</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Notes</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {benchmarks.map((benchmark) => (
            <MyBenchmarkRow
              key={benchmark.id}
              benchmark={benchmark}
              isHistorical={isHistorical}
              onEdit={onEdit}
              onCreateNew={onCreateNew}
            />
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}