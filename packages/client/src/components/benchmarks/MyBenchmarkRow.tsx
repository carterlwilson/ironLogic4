import { Table, Badge, Group, ActionIcon, Text, Tooltip } from '@mantine/core';
import { IconEdit, IconRefresh, IconClock } from '@tabler/icons-react';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import { formatDate, isBenchmarkEditable, getBenchmarkAgeInDays } from '../../utils/benchmarkUtils';
import { formatMeasurement } from '../../utils/benchmarkFormatters';

interface MyBenchmarkRowProps {
  benchmark: ClientBenchmark;
  isHistorical: boolean;
  onEdit?: (benchmark: ClientBenchmark) => void;
  onCreateNew?: (benchmark: ClientBenchmark) => void;
}

function getBenchmarkTypeColor(type: BenchmarkType): string {
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
}

export function MyBenchmarkRow({
  benchmark,
  isHistorical,
  onEdit,
  onCreateNew,
}: MyBenchmarkRowProps) {
  const isEditable = !isHistorical && isBenchmarkEditable(benchmark);
  const ageInDays = getBenchmarkAgeInDays(benchmark);

  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>{benchmark.name}</Text>
      </Table.Td>

      <Table.Td>
        <Badge color={getBenchmarkTypeColor(benchmark.type)} variant="light">
          {benchmark.type}
        </Badge>
      </Table.Td>

      <Table.Td>
        <Group gap="xs">
          {benchmark.tags.map((tag) => (
            <Badge key={tag} size="sm" variant="outline" color="gray">
              {tag}
            </Badge>
          ))}
        </Group>
      </Table.Td>

      <Table.Td>
        <Text fw={600}>
          {formatMeasurement(
            benchmark.type,
            undefined, // weightKg is deprecated
            benchmark.timeSeconds,
            benchmark.reps,
            benchmark.otherNotes,
            benchmark.repMaxes
          )}
        </Text>
      </Table.Td>

      <Table.Td>
        <Group gap={4}>
          <Text size="sm">
            {benchmark.recordedAt ? formatDate(benchmark.recordedAt) :
             benchmark.repMaxes?.[0]?.recordedAt ? formatDate(benchmark.repMaxes[0].recordedAt) : 'N/A'}
          </Text>
          {ageInDays >= 6 && !isHistorical && (
            <Tooltip label={`${ageInDays} days old - will become historical after 7 days`}>
              <IconClock size={14} style={{ color: 'var(--mantine-color-orange-6)' }} />
            </Tooltip>
          )}
        </Group>
      </Table.Td>

      <Table.Td>
        {benchmark.notes ? (
          <Tooltip label={benchmark.notes} multiline w={300}>
            <Text size="sm" lineClamp={1} style={{ cursor: 'help' }}>
              {benchmark.notes}
            </Text>
          </Tooltip>
        ) : (
          <Text size="sm" c="dimmed">
            -
          </Text>
        )}
      </Table.Td>

      <Table.Td>
        <Group gap="xs" justify="flex-end">
          {isHistorical ? (
            <Tooltip label="Create new benchmark from this historical record">
              <ActionIcon
                variant="light"
                color="forestGreen"
                onClick={() => onCreateNew?.(benchmark)}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <>
              {isEditable ? (
                <Tooltip label="Edit benchmark (less than 1 week old)">
                  <ActionIcon
                    variant="light"
                    color="forestGreen"
                    onClick={() => onEdit?.(benchmark)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Tooltip label="Cannot edit - benchmark is more than 1 week old. Create a new one instead.">
                  <ActionIcon
                    variant="light"
                    color="forestGreen"
                    onClick={() => onCreateNew?.(benchmark)}
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}