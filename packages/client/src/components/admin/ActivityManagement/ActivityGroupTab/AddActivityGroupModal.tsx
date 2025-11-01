import { Modal, Stack, Group, TextInput, Textarea, Button } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconFolder } from '@tabler/icons-react';
import type { CreateActivityGroupRequest } from '../../../../services/activityGroupApi';

interface AddActivityGroupModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateActivityGroupRequest) => Promise<void>;
  loading?: boolean;
  gymId: string;
}

export function AddActivityGroupModal({
  opened,
  onClose,
  onSubmit,
  loading = false,
  gymId,
}: AddActivityGroupModalProps) {
  const form = useForm<CreateActivityGroupRequest>({
    initialValues: {
      name: '',
      notes: '',
      gymId,
    },
    validate: {
      name: (value) => {
        if (!value?.trim()) return 'Name is required';
        if (value.trim().length < 1) return 'Name must be at least 1 character';
        if (value.trim().length > 100) return 'Name must be less than 100 characters';
        return null;
      },
      notes: (value) => {
        if (value && value.length > 500) return 'Notes must be less than 500 characters';
        return null;
      },
    },
  });

  const handleSubmit = async (values: CreateActivityGroupRequest) => {
    try {
      await onSubmit({ ...values, gymId });
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add New Activity Group"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Group Name"
            placeholder="Enter group name"
            leftSection={<IconFolder size={16} />}
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Notes"
            placeholder="Add optional notes or description"
            minRows={3}
            maxRows={6}
            {...form.getInputProps('notes')}
          />

          {/* Actions */}
          <Group justify="flex-end" gap="md" mt="md">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="green"
              loading={loading}
              disabled={!form.isValid()}
            >
              Create Group
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}