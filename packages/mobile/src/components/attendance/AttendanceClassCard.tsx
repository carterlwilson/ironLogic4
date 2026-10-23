import { Paper, Group, Stack, Text, Badge } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { FlatCoachTimeslot } from '../../utils/coachScheduleUtils';
import { formatTimeRange } from '../../utils/scheduleUtils';

interface AttendanceClassCardProps {
  slot: FlatCoachTimeslot;
  locked: boolean;
  onSelect: () => void;
}

export function AttendanceClassCard({ slot, locked, onSelect }: AttendanceClassCardProps) {
  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      onClick={locked ? undefined : onSelect}
      style={{ cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.5 : 1 }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={4}>
          <Text fw={600} size="sm">
            {formatTimeRange(slot.startTime, slot.endTime)}
          </Text>
          <Text size="xs" c="dimmed">
            {slot.location}
          </Text>
        </Stack>
        <Group gap="xs" wrap="nowrap">
          <Badge size="sm" variant="light">
            {slot.assignedClients.length} signed up
          </Badge>
          {locked ? (
            <Badge size="sm" variant="light" color="gray">
              Not yet
            </Badge>
          ) : (
            <IconChevronRight size={18} color="var(--mantine-color-gray-6)" />
          )}
        </Group>
      </Group>
    </Paper>
  );
}
