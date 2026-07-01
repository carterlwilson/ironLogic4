import { Modal, Button, Group, Text, Stack } from '@mantine/core';
import { FlatTimeslot } from '../../hooks/useSchedule';
import { getDayName, formatTimeRange } from '../../utils/scheduleUtils';

interface ConfirmLeaveModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  slot: FlatTimeslot | null;
  loading: boolean;
}

export function ConfirmLeaveModal({ opened, onClose, onConfirm, slot, loading }: ConfirmLeaveModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Leave Timeslot" size="sm" centered>
      {slot && (
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to leave{' '}
            <Text span fw={600}>
              {getDayName(slot.dayOfWeek)}, {formatTimeRange(slot.startTime, slot.endTime)}
            </Text>
            ?
          </Text>

          <Group justify="flex-end" gap="sm" mt="xs">
            <Button variant="subtle" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="filled" color="red" onClick={onConfirm} loading={loading}>
              Leave Timeslot
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
