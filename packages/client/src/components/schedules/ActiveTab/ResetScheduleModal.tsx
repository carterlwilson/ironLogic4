import { Modal, Stack, Text, Button, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ResetScheduleModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

/**
 * Confirmation modal for resetting the active schedule
 */
export function ResetScheduleModal({
  opened,
  onClose,
  onConfirm,
  loading = false,
}: ResetScheduleModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconAlertTriangle size={24} color="orange" />
          <Text size="lg" fw={600}>
            Reset Active Schedule
          </Text>
        </Group>
      }
    >
      <Stack gap="md">
        <Text>
          Are you sure you want to reset the active schedule?
        </Text>
        <Text size="sm" c="dimmed">
          This will clear all client assignments from all timeslots. The schedule
          structure and coaches will remain unchanged. This action cannot be undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button color="orange" onClick={handleConfirm} loading={loading}>
            Reset Schedule
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}