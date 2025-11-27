import { Modal, Stack, Select, NumberInput, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import type { IActivityGroupTarget } from '@ironlogic4/shared/types/programs';
import type { ActivityGroupOption } from '../../../hooks/useActivityGroupOptions';

interface ActivityGroupTargetModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (target: Omit<IActivityGroupTarget, 'id'>) => void;
  existingTarget?: IActivityGroupTarget | null;
  existingGroupIds?: string[]; // IDs already in use (for validation)
  groupOptions: ActivityGroupOption[];
}

export function ActivityGroupTargetModal({
  opened,
  onClose,
  onSubmit,
  existingTarget,
  existingGroupIds = [],
  groupOptions
}: ActivityGroupTargetModalProps) {

  const form = useForm<Omit<IActivityGroupTarget, 'id'>>({
    initialValues: {
      activityGroupId: existingTarget?.activityGroupId || '',
      targetPercentage: existingTarget?.targetPercentage || 0,
    },
    validate: {
      activityGroupId: (value) => {
        if (!value) return 'Activity group is required';
        // Only validate duplicates if adding new (not editing)
        if (!existingTarget && existingGroupIds.includes(value)) {
          return 'This activity group already has a target';
        }
        return null;
      },
      targetPercentage: (value) => {
        if (value < 0) return 'Percentage must be at least 0';
        if (value > 100) return 'Percentage cannot exceed 100';
        return null;
      },
    },
  });

  // Update form when existing target changes
  useEffect(() => {
    if (existingTarget) {
      form.setValues({
        activityGroupId: existingTarget.activityGroupId,
        targetPercentage: existingTarget.targetPercentage,
      });
    } else {
      form.reset();
    }
  }, [existingTarget]);

  const handleSubmit = (values: Omit<IActivityGroupTarget, 'id'>) => {
    onSubmit(values);
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={existingTarget ? 'Edit Activity Group Target' : 'Add Activity Group Target'}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="Activity Group"
            placeholder="Select activity group"
            data={groupOptions.filter(opt => opt.value !== '')} // Remove "No group" option
            searchable
            required
            disabled={!!existingTarget} // Disable when editing
            {...form.getInputProps('activityGroupId')}
          />

          <NumberInput
            label="Target Percentage"
            placeholder="Enter target percentage"
            min={0}
            max={100}
            suffix="%"
            required
            {...form.getInputProps('targetPercentage')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {existingTarget ? 'Save Changes' : 'Add Target'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}