import { Modal, Stack, Text, Alert, Button, Group, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import type { User } from '@ironlogic4/shared/types/users';

interface DeleteUserModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (user: User) => Promise<void>;
  loading?: boolean;
}

export function DeleteUserModal({ opened, onClose, user, onConfirm, loading = false }: DeleteUserModalProps) {
  const form = useForm({
    initialValues: {
      confirmation: '',
    },
    validate: {
      confirmation: (value) => {
        if (!user) return null;
        const expectedText = `${user.firstName} ${user.lastName}`;
        if (value !== expectedText) {
          return `Please type "${expectedText}" to confirm deletion`;
        }
        return null;
      },
    },
  });

  const handleSubmit = async () => {
    if (!user || !form.isValid()) return;

    try {
      await onConfirm(user);
      handleClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Delete User Account"
      size="md"
      centered
      withCloseButton={!loading}
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Alert
          color="red"
          icon={<IconAlertTriangle size={20} />}
          title="This action cannot be undone"
        >
          <Text size="sm">
            You are about to permanently delete <strong>{fullName}</strong>'s account.
            This will remove all of their data and cannot be reversed.
          </Text>
        </Alert>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            User Details:
          </Text>
          <Text size="sm" c="dimmed">
            Name: {fullName}
          </Text>
          <Text size="sm" c="dimmed">
            Email: {user.email}
          </Text>
          <Text size="sm" c="dimmed">
            Role: {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
          </Text>
          <Text size="sm" c="dimmed">
            Created: {new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Stack>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Confirmation Required
              </Text>
              <Text size="sm" c="dimmed">
                To confirm deletion, please type the user's full name exactly as shown:
              </Text>
              <Text size="sm" fw={500} c="red">
                {fullName}
              </Text>
            </Stack>

            <TextInput
              placeholder={`Type "${fullName}" to confirm`}
              {...form.getInputProps('confirmation')}
              disabled={loading}
            />

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
                color="red"
                leftSection={<IconTrash size={16} />}
                loading={loading}
                disabled={!form.isValid()}
              >
                Delete User Account
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}