import { Modal, Text, Button, Group, Stack } from '@mantine/core';
import { formatTimeRange, getDayName } from '../../utils/scheduleUtils';

interface ConfirmLeaveModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  timeslot: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  } | null;
  loading?: boolean;
}

export function ConfirmLeaveModal({
  opened,
  onClose,
  onConfirm,
  timeslot,
  loading = false,
}: ConfirmLeaveModalProps) {
  if (!timeslot) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Leave Timeslot?"
      centered
    >
      <Stack gap="md">
        <Text size="sm">
          Are you sure you want to leave this timeslot?
        </Text>

        <Stack gap="xs" p="md" style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 8 }}>
          <Text size="sm" fw={600}>
            {getDayName(timeslot.dayOfWeek)}
          </Text>
          <Text size="sm" c="dimmed">
            {formatTimeRange(timeslot.startTime, timeslot.endTime)}
          </Text>
        </Stack>

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm} loading={loading}>
            Leave Timeslot
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}