import { Card, Text, Group, Button, Badge, Stack, Loader } from '@mantine/core';
import { IconCheck, IconClock, IconUsers } from '@tabler/icons-react';
import { formatTimeRange, formatCapacity } from '../../utils/scheduleUtils';

interface TimeslotCardProps {
  id: string;
  scheduleId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSpots: number;
  isUserAssigned: boolean;
  loading?: boolean;
  onJoin: (scheduleId: string, timeslotId: string) => void;
  onLeave: (scheduleId: string, timeslotId: string) => void;
}

export function TimeslotCard({
  id,
  scheduleId,
  startTime,
  endTime,
  capacity,
  availableSpots,
  isUserAssigned,
  loading = false,
  onJoin,
  onLeave,
}: TimeslotCardProps) {
  const isFull = availableSpots === 0 && !isUserAssigned;

  const getButtonProps = () => {
    if (isUserAssigned) {
      return {
        color: 'green',
        variant: 'light' as const,
        leftSection: <IconCheck size={18} />,
        onClick: () => onLeave(scheduleId, id),
        children: 'Joined',
      };
    }

    if (isFull) {
      return {
        color: 'red',
        variant: 'light' as const,
        disabled: true,
        children: 'Full',
      };
    }

    return {
      color: 'blue',
      variant: 'filled' as const,
      onClick: () => onJoin(scheduleId, id),
      children: 'Join',
    };
  };

  const buttonProps = getButtonProps();

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group justify="space-between" align="center" wrap="nowrap">
        {/* Time and Capacity Info */}
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group gap="xs">
            <IconClock size={16} style={{ opacity: 0.6 }} />
            <Text size="sm" fw={600}>
              {formatTimeRange(startTime, endTime)}
            </Text>
          </Group>

          <Group gap="xs">
            <IconUsers size={16} style={{ opacity: 0.6 }} />
            <Text size="xs" c="dimmed">
              {formatCapacity(availableSpots, capacity)}
            </Text>
            {availableSpots === 0 && !isUserAssigned && (
              <Badge color="red" size="xs" variant="light">
                Full
              </Badge>
            )}
            {isUserAssigned && (
              <Badge color="green" size="xs" variant="light">
                You're in
              </Badge>
            )}
          </Group>
        </Stack>

        {/* Action Button */}
        <Button
          size="md"
          style={{ minWidth: 100 }}
          disabled={loading}
          {...buttonProps}
        >
          {loading ? <Loader size={18} /> : buttonProps.children}
        </Button>
      </Group>
    </Card>
  );
}