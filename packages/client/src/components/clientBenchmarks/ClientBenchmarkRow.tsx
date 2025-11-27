import { Table, Group, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconEdit, IconTrash, IconArrowsExchange } from '@tabler/icons-react';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';

interface ClientBenchmarkRowProps {
  benchmark: ClientBenchmark;
  onEdit: (benchmark: ClientBenchmark) => void;
  onDelete: (benchmark: ClientBenchmark) => void;
  onMove: (benchmark: ClientBenchmark) => void;
}

const getBenchmarkTypeColor = (type: BenchmarkType): string => {
  switch (type) {
    case BenchmarkType.WEIGHT:
      return 'blue';
    case BenchmarkType.TIME:
      return 'green';
    case BenchmarkType.REPS:
      return 'orange';
    case BenchmarkType.OTHER:
      return 'gray';
    default:
      return 'gray';
  }
};

export function ClientBenchmarkRow({ benchmark, onEdit, onDelete, onMove }: ClientBenchmarkRowProps) {
  return (
    <Table.Tr>
      <Table.Td>{benchmark.name}</Table.Td>
      <Table.Td>
        <Badge color={getBenchmarkTypeColor(benchmark.type)} variant="light">
          {benchmark.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        {benchmark.tags.length > 0 ? (
          <Group gap="xs">
            {benchmark.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} size="sm" variant="outline">
                {tag}
              </Badge>
            ))}
            {benchmark.tags.length > 2 && (
              <Badge size="sm" variant="outline">
                +{benchmark.tags.length - 2}
              </Badge>
            )}
          </Group>
        ) : (
          '-'
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Move to Historical/Current">
            <ActionIcon
              variant="light"
              color="violet"
              onClick={() => onMove(benchmark)}
            >
              <IconArrowsExchange size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Edit">
            <ActionIcon
              variant="light"
              color="forestGreen"
              onClick={() => onEdit(benchmark)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon
              variant="light"
              color="red"
              onClick={() => onDelete(benchmark)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}