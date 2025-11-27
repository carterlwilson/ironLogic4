import { Card, Text, Group, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconPencil, IconClock } from '@tabler/icons-react';
import { RepMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { formatDate, getRepMaxAgeInDays } from '../../utils/benchmarkUtils';

interface RepMaxCardProps {
  repMax: RepMax;
  benchmarkId: string;
  benchmarkName: string;
  templateRepMaxName: string;  // e.g., "1RM", "3RM"
  templateRepMaxReps: number;  // e.g., 1, 3
  isHistorical: boolean;
  isEditable: boolean;  // Based on age (< 14 days)
  onEdit: () => void;
}

export function RepMaxCard({
  repMax,
  templateRepMaxName,
  isHistorical,
  isEditable,
  onEdit,
}: RepMaxCardProps) {
  const ageInDays = getRepMaxAgeInDays(repMax);

  return (
    <Card
      shadow="xs"
      padding="sm"
      radius="md"
      withBorder
      style={{ position: 'relative', minHeight: '120px' }}
    >
      <Stack gap="xs" h="100%" justify="space-between">
        {/* Header with badge and edit icon */}
        <Group justify="space-between" align="flex-start">
          <Badge color="forestGreen" variant="light" size="md">
            {templateRepMaxName}
          </Badge>
          {!isHistorical && isEditable && (
            <ActionIcon
              variant="subtle"
              color="forestGreen"
              size="sm"
              onClick={onEdit}
              aria-label={`Edit ${templateRepMaxName}`}
            >
              <IconPencil size={14} />
            </ActionIcon>
          )}
        </Group>

        {/* Weight display */}
        <Text size="xl" fw={700} ta="center" c="forestGreen">
          {repMax.weightKg} kg
        </Text>

        {/* Date and age */}
        <Stack gap={4}>
          <Group gap="xs" align="center" justify="center">
            <IconClock size={12} style={{ opacity: 0.6 }} />
            <Text size="xs" c="dimmed">
              {formatDate(repMax.recordedAt)}
            </Text>
          </Group>
          {!isHistorical && (
            <Text size="xs" c="dimmed" ta="center">
              {ageInDays} day{ageInDays !== 1 ? 's' : ''} ago
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}