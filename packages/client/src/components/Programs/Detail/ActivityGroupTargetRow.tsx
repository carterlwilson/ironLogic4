import { Group, Text, Badge, ActionIcon, Progress, Stack } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import type { VolumeStatus } from '../../../utils/volumeCalculations';

interface ActivityGroupTargetRowProps {
  groupName: string;
  targetPercentage: number;
  volumeStatus?: VolumeStatus;
  onEdit: () => void;
  onDelete: () => void;
}

export function ActivityGroupTargetRow({
  groupName,
  targetPercentage,
  volumeStatus,
  onEdit,
  onDelete,
}: ActivityGroupTargetRowProps) {
  const getStatusColor = (status?: 'red' | 'yellow' | 'green') => {
    switch (status) {
      case 'red': return 'red';
      case 'yellow': return 'yellow';
      case 'green': return 'green';
      default: return 'gray';
    }
  };

  const getStatusEmoji = (status?: 'red' | 'yellow' | 'green') => {
    switch (status) {
      case 'red': return '🔴';
      case 'yellow': return '🟡';
      case 'green': return '🟢';
      default: return '⚪';
    }
  };

  const actualPercentage = volumeStatus ? volumeStatus.percentage : 0;
  const statusColor = getStatusColor(volumeStatus?.status);
  const statusEmoji = getStatusEmoji(volumeStatus?.status);

  return (
    <Stack gap="xs" p="sm" style={{ borderLeft: `3px solid var(--mantine-color-${statusColor}-6)`, backgroundColor: 'var(--mantine-color-gray-0)' }}>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md" style={{ flex: 1 }}>
          <Text fw={500} size="sm">{groupName}</Text>
          <Badge size="sm" color="forestGreen" variant="light">
            Target: {targetPercentage}%
          </Badge>
          {volumeStatus && (
            <>
              <Badge size="sm" color={statusColor} variant="filled">
                Actual: {actualPercentage.toFixed(1)}%
              </Badge>
              <Text size="xs" c="dimmed">
                {statusEmoji} {volumeStatus.actual} / {volumeStatus.target.toFixed(0)} reps
              </Text>
            </>
          )}
        </Group>

        <Group gap="xs">
          <ActionIcon variant="subtle" size="sm" onClick={onEdit}>
            <IconEdit size={14} />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm" color="red" onClick={onDelete}>
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Group>

      {volumeStatus && (
        <Progress
          value={Math.min(actualPercentage, 100)}
          color={statusColor}
          size="sm"
          style={{ width: '100%' }}
        />
      )}
    </Stack>
  );
}