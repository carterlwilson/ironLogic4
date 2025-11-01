import { Modal, Stack, Text, Button, Group, MultiSelect } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUsers } from '@tabler/icons-react';
import type { IActiveSchedule } from '@ironlogic4/shared';
import type { Coach } from '../../../hooks/useCoaches';

interface EditCoachesModalProps {
  opened: boolean;
  onClose: () => void;
  schedule: IActiveSchedule | null;
  coaches: Coach[];
  onConfirm: (coachIds: string[]) => Promise<void>;
  loading?: boolean;
}

/**
 * Modal for editing coaches assigned to the active schedule
 */
export function EditCoachesModal({
  opened,
  onClose,
  schedule,
  coaches,
  onConfirm,
  loading = false,
}: EditCoachesModalProps) {
  const coachOptions = coaches.map((coach) => ({
    value: coach.id,
    label: `${coach.firstName} ${coach.lastName}`.trim() || coach.email,
  }));

  const form = useForm({
    initialValues: {
      coachIds: schedule?.coachIds || [],
    },
    validate: {
      coachIds: (value) => {
        if (!value || value.length === 0) return 'At least one coach is required';
        return null;
      },
    },
  });

  const handleSubmit = async (values: { coachIds: string[] }) => {
    await onConfirm(values.coachIds);
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!schedule) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconUsers size={24} />
          <Text size="lg" fw={600}>
            Edit Assigned Coaches
          </Text>
        </Group>
      }
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <MultiSelect
            label="Coaches"
            placeholder="Select coaches"
            data={coachOptions}
            required
            searchable
            {...form.getInputProps('coachIds')}
          />

          <Text size="sm" c="dimmed">
            These coaches will be assigned to all timeslots in the schedule.
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Update Coaches
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}