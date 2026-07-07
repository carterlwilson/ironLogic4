import { Card, Text, Group, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconPencil, IconClock } from '@tabler/icons-react';
import { TimeSubMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
import { formatDate, getTimeSubMaxAgeInDays } from '../../utils/benchmarkUtils';

interface TimeSubMaxCardProps {
  timeSubMax: TimeSubMax;
  benchmarkId: string;
  benchmarkName: string;
  templateSubMaxName: string;  // e.g., "1 min", "3 min"
  distanceUnit: DistanceUnit;  // For display (meters/kilometers)
  isHistorical: boolean;
  onUpdate?: () => void;
}

export function TimeSubMaxCard({
  timeSubMax,
  templateSubMaxName,
  distanceUnit,
  isHistorical,
  onUpdate,
}: TimeSubMaxCardProps) {
  const ageInDays = getTimeSubMaxAgeInDays(timeSubMax);

  // Convert distance for display
  const distanceValue = distanceUnit === DistanceUnit.KILOMETERS
    ? (timeSubMax.distanceMeters / 1000).toFixed(2)
    : timeSubMax.distanceMeters.toString();
  const unitLabel = distanceUnit === DistanceUnit.KILOMETERS ? 'km' : 'm';

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
            {templateSubMaxName}
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
              aria-label={`Update ${templateSubMaxName}`}
            >
              <IconPencil size={14} />
            </ActionIcon>
          )}
        </Group>

        {/* Distance display */}
        <Text size="xl" fw={700} ta="center" c="forestGreen">
          {distanceValue} {unitLabel}
        </Text>

        {/* Date and age */}
        <Stack gap={4}>
          <Group gap="xs" align="center" justify="center">
            <IconClock size={12} style={{ opacity: 0.6 }} />
            <Text size="xs" c="dimmed">
              {formatDate(timeSubMax.recordedAt)}
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
