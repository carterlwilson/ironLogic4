import { Modal, Stack, Group, Text, Button, Switch, PasswordInput, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconLock, IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';
import type { CoachResponse, ResetCoachPasswordRequest } from '@ironlogic4/shared/types/coaches';

interface ResetPasswordModalProps {
  opened: boolean;
  onClose: () => void;
  coach: CoachResponse | null;
  onConfirm: (id: string, data: ResetCoachPasswordRequest) => Promise<void>;
  loading?: boolean;
}

export function ResetPasswordModal({
  opened,
  onClose,
  coach,
  onConfirm,
  loading = false,
}: ResetPasswordModalProps) {
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);

  const form = useForm<ResetCoachPasswordRequest>({
    initialValues: {
      password: '',
    },
    validate: {
      password: (value) => {
        if (!autoGeneratePassword) {
          if (!value?.trim()) return 'Password is required';
          if (value && value.length < 8) return 'Password must be at least 8 characters';
          return null;
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: ResetCoachPasswordRequest) => {
    if (!coach) return;

    try {
      const submitData: ResetCoachPasswordRequest = {};

      // Only include password if not auto-generating
      if (!autoGeneratePassword) {
        submitData.password = values.password;
      }

      await onConfirm(coach.id, submitData);
      form.reset();
      setAutoGeneratePassword(true);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    setAutoGeneratePassword(true);
    onClose();
  };

  if (!coach) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Reset Password"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Password Reset"
            color="orange"
          >
            <Text size="sm">
              Resetting the password for{' '}
              <strong>{coach.firstName} {coach.lastName}</strong>.
            </Text>
            <Text size="sm" mt="xs">
              The coach will need to use the new password to log in.
            </Text>
          </Alert>

          <Stack gap="xs">
            <Group>
              <Text size="sm" c="dimmed" style={{ width: 80 }}>
                Name:
              </Text>
              <Text size="sm" fw={500}>
                {coach.firstName} {coach.lastName}
              </Text>
            </Group>
            <Group>
              <Text size="sm" c="dimmed" style={{ width: 80 }}>
                Email:
              </Text>
              <Text size="sm">
                {coach.email}
              </Text>
            </Group>
          </Stack>

          {/* Password section */}
          <Switch
            label="Auto-generate password"
            description="A temporary password will be generated and displayed"
            checked={autoGeneratePassword}
            onChange={(e) => setAutoGeneratePassword(e.currentTarget.checked)}
          />

          {!autoGeneratePassword && (
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              leftSection={<IconLock size={16} />}
              required={!autoGeneratePassword}
              {...form.getInputProps('password')}
            />
          )}

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
              color="orange"
              loading={loading}
              disabled={!form.isValid()}
            >
              Reset Password
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}