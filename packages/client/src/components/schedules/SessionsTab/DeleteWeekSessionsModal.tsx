import { Modal, Stack, Text, Button, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface DeleteWeekSessionsModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  weekLabel: string;
  sessionCount: number;
}

export function DeleteWeekSessionsModal({
  opened,
  onClose,
  onConfirm,
  loading = false,
  weekLabel,
  sessionCount,
}: DeleteWeekSessionsModalProps) {
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
          <IconAlertTriangle size={20} color="red" />
          <Text size="lg" fw={600}>Delete All Sessions</Text>
        </Group>
      }
    >
      <Stack gap="md">
        <Text>
          Are you sure you want to delete all <strong>{sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}</strong> for the week of <strong>{weekLabel}</strong>?
        </Text>
        <Text size="sm" c="dimmed">
          This will permanently remove all sessions and their enrollments for this week. This cannot be undone.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={handleConfirm} loading={loading}>Delete All</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
