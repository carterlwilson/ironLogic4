import { Card, Text, Group, Badge, Button, Stack, Paper } from '@mantine/core';
import { IconPencil, IconRefresh, IconClock } from '@tabler/icons-react';
import { ClientBenchmark } from '@ironlogic4/shared';
import {
  isBenchmarkEditable,
  formatDate,
  formatMeasurement,
  getBenchmarkAgeInDays,
} from '../../utils/benchmarkUtils';

interface BenchmarkCardProps {
  benchmark: ClientBenchmark;
  isHistorical: boolean;
  onEdit: (benchmark: ClientBenchmark) => void;
  onCreateNew: (benchmark: ClientBenchmark) => void;
}

export function BenchmarkCard({
  benchmark,
  isHistorical,
  onEdit,
  onCreateNew,
}: BenchmarkCardProps) {
  const isEditable = !isHistorical && isBenchmarkEditable(benchmark);
  const ageInDays = getBenchmarkAgeInDays(benchmark);

  const measurementValue = formatMeasurement(
    benchmark.type,
    benchmark.weightKg,
    benchmark.timeSeconds,
    benchmark.reps,
    benchmark.otherNotes
  );

  const getBadgeColor = () => {
    if (isHistorical) return 'gray';
    if (isEditable) return 'forestGreen';
    return 'orange';
  };

  const getActionButton = () => {
    // Historical benchmarks are view-only
    if (isHistorical) {
      return null;
    }

    // Current benchmarks: editable or create new
    if (isEditable) {
      return (
        <Button
          variant="light"
          color="forestGreen"
          size="md"
          leftSection={<IconPencil size={18} />}
          onClick={() => onEdit(benchmark)}
          fullWidth
        >
          Edit
        </Button>
      );
    }

    return (
      <Button
        variant="light"
        color="orange"
        size="md"
        leftSection={<IconRefresh size={18} />}
        onClick={() => onCreateNew(benchmark)}
        fullWidth
      >
        Create New
      </Button>
    );
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text fw={600} size="lg" lineClamp={2}>
              {benchmark.name}
            </Text>
          </div>
          <Badge color={getBadgeColor()} variant="light" size="lg">
            {benchmark.type}
          </Badge>
        </Group>

        {/* Measurement Value */}
        <Paper p="md" radius="md" bg="gray.0">
          <Text size="xl" fw={700} ta="center" c="forestGreen">
            {measurementValue}
          </Text>
        </Paper>

        {/* Metadata */}
        <Stack gap="xs">
          <Group gap="xs" align="center">
            <IconClock size={16} style={{ opacity: 0.6 }} />
            <Text size="sm" c="dimmed">
              {formatDate(benchmark.recordedAt)}
              {!isHistorical && ` (${ageInDays} day${ageInDays !== 1 ? 's' : ''} ago)`}
            </Text>
          </Group>

          {benchmark.notes && (
            <Paper p="sm" radius="sm" bg="gray.0">
              <Text size="sm" c="dimmed" lineClamp={2}>
                {benchmark.notes}
              </Text>
            </Paper>
          )}
        </Stack>

        {/* Action Button */}
        {getActionButton()}
      </Stack>
    </Card>
  );
}