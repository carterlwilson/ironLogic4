import { Modal, Stack, Text, Button, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { IScheduleTemplate } from '@ironlogic4/shared';

interface DeleteTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  template: IScheduleTemplate | null;
  onConfirm: (template: IScheduleTemplate) => Promise<void>;
  loading?: boolean;
}

/**
 * Confirmation modal for deleting a schedule template
 */
export function DeleteTemplateModal({
  opened,
  onClose,
  template,
  onConfirm,
  loading = false,
}: DeleteTemplateModalProps) {
  if (!template) return null;

  const handleConfirm = async () => {
    await onConfirm(template);
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
            Delete Schedule Template
          </Text>
        </Group>
      }
    >
      <Stack gap="md">
        <Text>
          Are you sure you want to delete the template "{template.name}"?
        </Text>
        <Text size="sm" c="dimmed">
          This action cannot be undone. This will permanently delete the template
          and all its configuration.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirm} loading={loading}>
            Delete Template
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}