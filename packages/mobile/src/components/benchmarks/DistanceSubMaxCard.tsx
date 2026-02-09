import { Card, Text, Group, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconPencil, IconClock, IconRefresh } from '@tabler/icons-react';
import { DistanceSubMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { formatDate, getDistanceSubMaxAgeInDays, formatTimeSeconds } from '../../utils/benchmarkUtils';

interface DistanceSubMaxCardProps {
  distanceSubMax: DistanceSubMax;
  benchmarkId: string;
  benchmarkName: string;
  templateDistanceSubMaxName: string;  // e.g., "100m", "400m"
  isHistorical: boolean;
  isEditable: boolean;  // Based on age (< 14 days)
  onEdit: () => void;
  onCreateNew?: () => void;
}

export function DistanceSubMaxCard({
  distanceSubMax,
  templateDistanceSubMaxName,
  isHistorical,
  isEditable,
  onEdit,
  onCreateNew,
}: DistanceSubMaxCardProps) {
  const ageInDays = getDistanceSubMaxAgeInDays(distanceSubMax);
  const isOldAndCreatable = !isHistorical && !isEditable && onCreateNew;

  const handleClick = () => {
    const handler = !isHistorical && isEditable ? onEdit : isOldAndCreatable ? onCreateNew : undefined;
    if (handler) handler();
  };

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
            {templateDistanceSubMaxName}
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
              aria-label={`Edit ${templateDistanceSubMaxName}`}
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
              aria-label={`Create new ${templateDistanceSubMaxName}`}
            >
              <IconRefresh size={14} />
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
