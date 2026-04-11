import { Modal, Stack, Text, Button, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { IScheduleTemplate } from '@ironlogic4/shared';
import { getDayName, formatTimeRange } from '../../../utils/scheduleUtils';

interface DeleteTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  template: IScheduleTemplate | null;
  onConfirm: (template: IScheduleTemplate) => Promise<void>;
  loading?: boolean;
}

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

  const description = `${getDayName(template.dayOfWeek)} ${template.period} ${formatTimeRange(template.time, template.endTime)}`;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconAlertTriangle size={20} color="red" />
          <Text size="lg" fw={600}>Delete Template</Text>
        </Group>
      }
    >
      <Stack gap="md">
        <Text>
          Are you sure you want to delete the template for <strong>{description}</strong>?
        </Text>
        <Text size="sm" c="dimmed">
          This is only allowed if no sessions have been generated from this template. To stop future sessions without losing history, deactivate it instead.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>Cancel</Button>
          <Button color="red" onClick={handleConfirm} loading={loading}>Delete</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
