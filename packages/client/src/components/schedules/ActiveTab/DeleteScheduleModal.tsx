import { Modal, Stack, Text, Button, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface DeleteScheduleModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

/**
 * Confirmation modal for deleting the active schedule
 */
export function DeleteScheduleModal({
  opened,
  onClose,
  onConfirm,
  loading = false,
}: DeleteScheduleModalProps) {
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
          <IconAlertTriangle size={24} color="red" />
          <Text size="lg" fw={600}>
            Delete Active Schedule
          </Text>
        </Group>
      }
    >
      <Stack gap="md">
        <Text>
          Are you sure you want to delete the active schedule?
        </Text>
        <Text size="sm" c="dimmed">
          This will permanently delete the active schedule and all client assignments.
          This action cannot be undone. You can create a new schedule from a template afterward.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirm} loading={loading}>
            Delete Schedule
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}