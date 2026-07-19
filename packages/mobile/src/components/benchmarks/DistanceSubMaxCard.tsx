import { Card, Text, Group, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconPencil, IconClock } from '@tabler/icons-react';
import { DistanceSubMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { formatDate, getDistanceSubMaxAgeInDays, formatTimeSeconds } from '../../utils/benchmarkUtils';

interface DistanceSubMaxCardProps {
  distanceSubMax: DistanceSubMax;
  benchmarkId: string;
  benchmarkName: string;
  templateDistanceSubMaxName: string;  // e.g., "100m", "400m"
  isHistorical: boolean;
  onUpdate?: () => void;
}

export function DistanceSubMaxCard({
  distanceSubMax,
  templateDistanceSubMaxName,
  isHistorical,
  onUpdate,
}: DistanceSubMaxCardProps) {
  const ageInDays = getDistanceSubMaxAgeInDays(distanceSubMax);

  return (
    <Card
      shadow="xs"
      padding="sm"
      radius="md"
      withBorder
      style={{
        position: 'relative',
        minHeight: '120px',
        cursor: !isHistorical && onUpdate ? 'pointer' : 'default',
      }}
      onClick={!isHistorical && onUpdate ? () => onUpdate() : undefined}
    >
      <Stack gap="xs" h="100%" justify="space-between">
        {/* Header with badge and icon */}
        <Group justify="space-between" align="flex-start">
          <Badge color="forestGreen" variant="light" size="md">
            {templateDistanceSubMaxName}
          </Badge>
          {!isHistorical && onUpdate && (
            <ActionIcon
              variant="subtle"
              color="forestGreen"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate();
              }}
              aria-label={`Update ${templateDistanceSubMaxName}`}
            >
              <IconPencil size={14} />
            </ActionIcon>
          )}
        </Group>

        {/* Time display */}
        <Text size="xl" fw={700} ta="center" c="forestGreen">
          {formatTimeSeconds(distanceSubMax.timeSeconds)}
        </Text>

        {/* Date and age */}
        <Stack gap={4}>
          <Group gap="xs" align="center" justify="center">
            <IconClock size={12} style={{ opacity: 0.6 }} />
            <Text size="xs" c="dimmed">
              {formatDate(distanceSubMax.recordedAt)}
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
