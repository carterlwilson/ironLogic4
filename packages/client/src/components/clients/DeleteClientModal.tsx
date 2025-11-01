import { Modal, Stack, Text, Group, Button, Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { User } from '@ironlogic4/shared/types/users';

interface DeleteClientModalProps {
  opened: boolean;
  onClose: () => void;
  client: User | null;
  onConfirm: (client: User) => Promise<void>;
  loading?: boolean;
}

export function DeleteClientModal({ opened, onClose, client, onConfirm, loading = false }: DeleteClientModalProps) {
  const handleConfirm = async () => {
    if (!client) return;

    try {
      await onConfirm(client);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!client) return null;

  const benchmarkCount = (client.currentBenchmarks?.length || 0) + (client.historicalBenchmarks?.length || 0);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Client"
      size="md"
      centered
    >
      <Stack gap="md">
        <Alert icon={<IconAlertTriangle size={16} />} color="red">
          This action cannot be undone.
        </Alert>

        <Text>
          Are you sure you want to delete{' '}
          <Text component="span" fw={600}>
            {client.firstName} {client.lastName}
          </Text>
          ?
        </Text>

        {benchmarkCount > 0 && (
          <Text size="sm" c="dimmed">
            This will also delete {benchmarkCount} benchmark{benchmarkCount !== 1 ? 's' : ''} associated with this client.
          </Text>
        )}

        <Group justify="flex-end" gap="md" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleConfirm}
            loading={loading}
          >
            Delete Client
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}