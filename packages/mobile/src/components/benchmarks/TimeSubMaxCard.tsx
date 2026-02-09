import { Card, Text, Group, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconPencil, IconClock, IconRefresh } from '@tabler/icons-react';
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
  isEditable: boolean;  // Based on age (< 14 days)
  onEdit: () => void;
  onCreateNew?: () => void;
}

export function TimeSubMaxCard({
  timeSubMax,
  templateSubMaxName,
  distanceUnit,
  isHistorical,
  isEditable,
  onEdit,
  onCreateNew,
}: TimeSubMaxCardProps) {
  const ageInDays = getTimeSubMaxAgeInDays(timeSubMax);
  const isOldAndCreatable = !isHistorical && !isEditable && onCreateNew;

  const handleClick = () => {
    const handler = !isHistorical && isEditable ? onEdit : isOldAndCreatable ? onCreateNew : undefined;
    if (handler) handler();
  };

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
        cursor: !isHistorical && (isEditable || isOldAndCreatable) ? 'pointer' : 'default',
      }}
      onClick={handleClick}
    >
      <Stack gap="xs" h="100%" justify="space-between">
        {/* Header with badge and icon */}
        <Group justify="space-between" align="flex-start">
          <Badge color="forestGreen" variant="light" size="md">
            {templateSubMaxName}
          </Badge>
          {!isHistorical && isEditable && (
            <ActionIcon
              variant="subtle"
              color="forestGreen"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent double triggering
                onEdit();
              }}
              aria-label={`Edit ${templateSubMaxName}`}
            >
              <IconPencil size={14} />
            </ActionIcon>
          )}
          {isOldAndCreatable && (
            <ActionIcon
              variant="subtle"
              color="orange"
              size="sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent double triggering
                onCreateNew();
              }}
              aria-label={`Create new ${templateSubMaxName}`}
            >
              <IconRefresh size={14} />
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
