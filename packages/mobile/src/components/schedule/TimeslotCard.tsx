import { Paper, Group, Stack, Text, Badge, Button } from '@mantine/core';
import { FlatTimeslot } from '../../hooks/useSchedule';
import { formatTimeRange, formatCapacity, getCapacityColor } from '../../utils/scheduleUtils';

interface TimeslotCardProps {
  slot: FlatTimeslot;
  mode: 'my' | 'available';
  loading: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}

export function TimeslotCard({ slot, mode, loading, onJoin, onLeave }: TimeslotCardProps) {
  const coachLabel =
    slot.coaches.length > 0
      ? `Coaches: ${slot.coaches.map((c) => `${c.firstName} ${c.lastName}`).join(', ')}`
      : 'No coach assigned';

  return (
    <Paper withBorder p="sm" radius="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Text fw={600} size="sm">
            {formatTimeRange(slot.startTime, slot.endTime)}
          </Text>
          <Text size="xs" c="dimmed">
            {coachLabel}
          </Text>
          <Badge size="sm" color={getCapacityColor(slot.availableSpots, slot.capacity)} variant="light">
            {formatCapacity(slot.availableSpots, slot.capacity)}
          </Badge>
        </Stack>
        {mode === 'my' ? (
          <Button variant="subtle" color="red" size="xs" onClick={onLeave}>
            Leave
          </Button>
        ) : (
          <Button
            variant="filled"
            color="forestGreen"
            size="xs"
            loading={loading}
            disabled={loading}
            onClick={onJoin}
          >
            Join
          </Button>
        )}
      </Group>
    </Paper>
  );
}
