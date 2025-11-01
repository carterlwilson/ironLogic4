import { Modal, Stack, Text, Group, Button } from '@mantine/core';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';

interface DeleteActivityTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  template: ActivityTemplate | null;
  onConfirm: (template: ActivityTemplate) => Promise<void>;
  loading?: boolean;
}

export function DeleteActivityTemplateModal({
  opened,
  onClose,
  template,
  onConfirm,
  loading = false,
}: DeleteActivityTemplateModalProps) {
  const handleConfirm = async () => {
    if (!template) return;

    try {
      await onConfirm(template);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!template) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Activity Template"
      centered
      size="md"
    >
      <Stack gap="md">
        <Text>
          Are you sure you want to delete the activity template <strong>{template.name}</strong>?
        </Text>

        {template.notes && (
          <Text size="sm" c="dimmed">
            Notes: {template.notes}
          </Text>
        )}

        <Text size="sm" c="dimmed">
          This action cannot be undone.
        </Text>

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
            Delete Template
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}