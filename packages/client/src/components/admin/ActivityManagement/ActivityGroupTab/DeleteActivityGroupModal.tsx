import { Modal, Stack, Text, Group, Button, Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { ActivityGroup } from '@ironlogic4/shared/types/activityGroups';

interface DeleteActivityGroupModalProps {
  opened: boolean;
  onClose: () => void;
  group: ActivityGroup | null;
  onConfirm: (group: ActivityGroup) => Promise<void>;
  loading?: boolean;
}

export function DeleteActivityGroupModal({
  opened,
  onClose,
  group,
  onConfirm,
  loading = false,
}: DeleteActivityGroupModalProps) {
  const handleConfirm = async () => {
    if (!group) return;

    try {
      await onConfirm(group);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!group) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Activity Group"
      centered
      size="md"
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Warning"
          color="red"
        >
          This action cannot be undone. All activity templates associated with this group will also be deleted.
        </Alert>

        <Text>
          Are you sure you want to delete the activity group <strong>{group.name}</strong>?
        </Text>

        {group.notes && (
          <Text size="sm" c="dimmed">
            Notes: {group.notes}
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
            Delete Group
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}