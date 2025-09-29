import { Modal, Stack, Text, Alert, Button, Group, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import type { Gym } from '@ironlogic4/shared/types/gyms';

interface DeleteGymModalProps {
  opened: boolean;
  onClose: () => void;
  gym: Gym | null;
  onConfirm: (gym: Gym) => Promise<void>;
  loading?: boolean;
}

export function DeleteGymModal({ opened, onClose, gym, onConfirm, loading = false }: DeleteGymModalProps) {
  const form = useForm({
    initialValues: {
      confirmation: '',
    },
    validate: {
      confirmation: (value) => {
        if (!gym) return null;
        const expectedText = gym.name;
        if (value !== expectedText) {
          return `Please type "${expectedText}" to confirm deletion`;
        }
        return null;
      },
    },
  });

  const handleSubmit = async () => {
    if (!gym || !form.isValid()) return;

    try {
      await onConfirm(gym);
      handleClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!gym) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Delete Gym"
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
            You are about to permanently delete <strong>{gym.name}</strong>.
            This will remove all associated data and cannot be reversed.
          </Text>
        </Alert>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Gym Details:
          </Text>
          <Text size="sm" c="dimmed">
            Name: {gym.name}
          </Text>
          <Text size="sm" c="dimmed">
            Address: {gym.address}
          </Text>
          <Text size="sm" c="dimmed">
            Phone: {gym.phoneNumber}
          </Text>
          <Text size="sm" c="dimmed">
            Created: {new Date(gym.createdAt).toLocaleDateString('en-US', {
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
                To confirm deletion, please type the gym name exactly as shown:
              </Text>
              <Text size="sm" fw={500} c="red">
                {gym.name}
              </Text>
            </Stack>

            <TextInput
              placeholder={`Type "${gym.name}" to confirm`}
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
                Delete Gym
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}