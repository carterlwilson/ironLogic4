import { Modal, Stack, Group, TextInput, Textarea, Button } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconFolder } from '@tabler/icons-react';
import { useEffect } from 'react';
import type { ActivityGroup } from '@ironlogic4/shared/types/activityGroups';
import type { UpdateActivityGroupRequest } from '../../../../services/activityGroupApi';

interface EditActivityGroupModalProps {
  opened: boolean;
  onClose: () => void;
  group: ActivityGroup | null;
  onSubmit: (groupId: string, data: UpdateActivityGroupRequest) => Promise<void>;
  onDelete: (group: ActivityGroup) => void;
  loading?: boolean;
}

export function EditActivityGroupModal({
  opened,
  onClose,
  group,
  onSubmit,
  onDelete,
  loading = false,
}: EditActivityGroupModalProps) {
  const form = useForm<UpdateActivityGroupRequest>({
    initialValues: {
      name: '',
      notes: '',
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

  // Update form values when group changes
  useEffect(() => {
    if (group) {
      form.setValues({
        name: group.name,
        notes: group.notes || '',
      });
    }
  }, [group]);

  const handleSubmit = async (values: UpdateActivityGroupRequest) => {
    if (!group) return;

    try {
      await onSubmit(group.id, values);
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

  const handleDelete = () => {
    if (group) {
      onDelete(group);
    }
  };

  if (!group) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Activity Group"
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
          <Group justify="space-between" gap="md" mt="md">
            <Button
              variant="light"
              color="red"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>

            <Group gap="md">
              <Button
                variant="subtle"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="forestGreen"
                loading={loading}
                disabled={!form.isValid()}
              >
                Save Changes
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}