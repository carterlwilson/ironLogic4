import { Card, Text, Group, Badge, Button, Stack, Paper, Collapse, ActionIcon } from '@mantine/core';
import { IconPencil, IconRefresh, IconClock, IconChevronDown } from '@tabler/icons-react';
import { ClientBenchmark } from '@ironlogic4/shared';
import {
  isBenchmarkEditable,
  formatDate,
  formatMeasurement,
  getBenchmarkAgeInDays,
} from '../../utils/benchmarkUtils';
import { useState } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);
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
    <Card shadow="sm" padding={isExpanded ? "lg" : "sm"} radius="md" withBorder>
      <Stack gap="xs">
        {/* Always visible clickable header - only name and chevron */}
        <Group
          justify="space-between"
          align="center"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <Text fw={600} size="md" lineClamp={2} style={{ flex: 1 }}>
            {benchmark.name}
          </Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <IconChevronDown
              size={20}
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
              }}
            />
          </ActionIcon>
        </Group>

        {/* Collapsible section with all details */}
        <Collapse in={isExpanded}>
          <Stack gap="md">
            {/* Type badge */}
            <Badge color={getBadgeColor()} variant="light" size="lg" style={{ alignSelf: 'flex-start' }}>
              {benchmark.type}
            </Badge>

            {/* Measurement value */}
            <Paper p="md" radius="md" bg="gray.0">
              <Text size="xl" fw={700} ta="center" c="forestGreen">
                {measurementValue}
              </Text>
            </Paper>

            {/* Date and age information */}
            <Group gap="xs" align="center">
              <IconClock size={16} style={{ opacity: 0.6 }} />
              <Text size="sm" c="dimmed">
                {formatDate(benchmark.recordedAt)}
                {!isHistorical && ` (${ageInDays} day${ageInDays !== 1 ? 's' : ''} ago)`}
              </Text>
            </Group>

            {/* Notes section */}
            {benchmark.notes && (
              <Paper p="sm" radius="sm" bg="gray.0">
                <Text size="sm" c="dimmed">
                  {benchmark.notes}
                </Text>
              </Paper>
            )}

            {/* Action Button */}
            {getActionButton()}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}