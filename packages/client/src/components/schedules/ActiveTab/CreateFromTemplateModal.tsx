import { Modal, Stack, Text, Button, Group, Paper, Badge } from '@mantine/core';
import { IconTemplate } from '@tabler/icons-react';
import type { IScheduleTemplate } from '@ironlogic4/shared';
import { getDayName } from '../../../utils/scheduleUtils';

interface CreateFromTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  template: IScheduleTemplate | null;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

/**
 * Modal for activating the gym's schedule template
 */
export function CreateFromTemplateModal({
  opened,
  onClose,
  template,
  onConfirm,
  loading = false,
}: CreateFromTemplateModalProps) {
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
          <IconTemplate size={24} />
          <Text size="lg" fw={600}>
            Activate Schedule
          </Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        {template && (
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Text fw={600}>{template.name}</Text>
              {template.description && (
                <Text size="sm" c="dimmed">
                  {template.description}
                </Text>
              )}

              <Group gap="xs">
                <Text size="sm" fw={500}>
                  Days:
                </Text>
                {template.days.map((day) => (
                  <Badge key={day.dayOfWeek} size="sm" variant="light" color="forestGreen">
                    {getDayName(day.dayOfWeek)} ({day.timeSlots.length} slots)
                  </Badge>
                ))}
              </Group>
            </Stack>
          </Paper>
        )}

        <Text size="sm" c="dimmed">
          This will create the active, client-bookable schedule based on this template.
          All timeslots will start with empty client assignments.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} loading={loading} disabled={!template}>
            Create Schedule
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
