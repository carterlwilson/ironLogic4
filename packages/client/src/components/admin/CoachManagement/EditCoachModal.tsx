import { Modal, Stack, Group, TextInput, Button } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser, IconMail } from '@tabler/icons-react';
import { useEffect } from 'react';
import type { CoachResponse, UpdateCoachRequest } from '@ironlogic4/shared/types/coaches';

interface EditCoachModalProps {
  opened: boolean;
  onClose: () => void;
  coach: CoachResponse | null;
  onSubmit: (id: string, data: UpdateCoachRequest) => Promise<void>;
  onDelete: (coach: CoachResponse) => void;
  loading?: boolean;
}

export function EditCoachModal({
  opened,
  onClose,
  coach,
  onSubmit,
  onDelete,
  loading = false,
}: EditCoachModalProps) {
  const form = useForm<UpdateCoachRequest>({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
    },
    validate: {
      email: (value) => {
        if (!value?.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        return null;
      },
      firstName: (value) => {
        if (!value?.trim()) return 'First name is required';
        if (value && value.trim().length < 1) return 'First name must be at least 1 character';
        if (value && value.trim().length > 50) return 'First name must be less than 50 characters';
        return null;
      },
      lastName: (value) => {
        if (!value?.trim()) return 'Last name is required';
        if (value && value.trim().length < 1) return 'Last name must be at least 1 character';
        if (value && value.trim().length > 50) return 'Last name must be less than 50 characters';
        return null;
      },
    },
  });

  // Populate form when coach changes
  useEffect(() => {
    if (coach) {
      form.setValues({
        email: coach.email,
        firstName: coach.firstName,
        lastName: coach.lastName,
      });
    }
  }, [coach]);

  const handleSubmit = async (values: UpdateCoachRequest) => {
    if (!coach) return;

    try {
      await onSubmit(coach.id, values);
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
    if (coach) {
      onDelete(coach);
    }
  };

  if (!coach) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Coach"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Email"
            placeholder="coach@example.com"
            leftSection={<IconMail size={16} />}
            required
            {...form.getInputProps('email')}
          />

          <Group grow>
            <TextInput
              label="First Name"
              placeholder="John"
              leftSection={<IconUser size={16} />}
              required
              {...form.getInputProps('firstName')}
            />

            <TextInput
              label="Last Name"
              placeholder="Doe"
              leftSection={<IconUser size={16} />}
              required
              {...form.getInputProps('lastName')}
            />
          </Group>

          {/* Actions */}
          <Group justify="space-between" gap="md" mt="md">
            <Button
              variant="subtle"
              color="red"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Coach
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