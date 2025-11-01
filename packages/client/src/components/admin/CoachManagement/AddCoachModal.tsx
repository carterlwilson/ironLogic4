import { Modal, Stack, Group, TextInput, PasswordInput, Button, Switch, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser, IconMail, IconLock } from '@tabler/icons-react';
import { useState } from 'react';
import type { CreateCoachRequest } from '@ironlogic4/shared/types/coaches';

interface AddCoachModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCoachRequest) => Promise<void>;
  loading?: boolean;
  isAdmin: boolean;
  gymId: string;
  gymOptions?: Array<{ value: string; label: string }>;
  gymsLoading?: boolean;
}

export function AddCoachModal({
  opened,
  onClose,
  onSubmit,
  loading = false,
  isAdmin,
  gymId,
  gymOptions = [],
  gymsLoading = false,
}: AddCoachModalProps) {
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);

  const form = useForm<CreateCoachRequest>({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      gymId: isAdmin ? '' : gymId,
    },
    validate: {
      email: (value) => {
        if (!value?.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        return null;
      },
      firstName: (value) => {
        if (!value?.trim()) return 'First name is required';
        if (value.trim().length < 1) return 'First name must be at least 1 character';
        if (value.trim().length > 50) return 'First name must be less than 50 characters';
        return null;
      },
      lastName: (value) => {
        if (!value?.trim()) return 'Last name is required';
        if (value.trim().length < 1) return 'Last name must be at least 1 character';
        if (value.trim().length > 50) return 'Last name must be less than 50 characters';
        return null;
      },
      password: (value) => {
        if (!autoGeneratePassword) {
          if (!value?.trim()) return 'Password is required';
          if (value.length < 8) return 'Password must be at least 8 characters';
          return null;
        }
        return null;
      },
      gymId: (value) => {
        if (isAdmin && !value?.trim()) return 'Gym is required';
        return null;
      },
    },
  });

  const handleSubmit = async (values: CreateCoachRequest) => {
    try {
      const submitData: CreateCoachRequest = {
        ...values,
        gymId: isAdmin ? values.gymId : gymId,
      };

      // Don't send password if auto-generating
      if (autoGeneratePassword) {
        delete submitData.password;
      }

      await onSubmit(submitData);
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

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add New Coach"
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

          {/* Gym selector - only for admin */}
          {isAdmin && (
            <Select
              label="Gym"
              placeholder="Select a gym"
              data={gymOptions}
              required
              searchable
              disabled={gymsLoading}
              {...form.getInputProps('gymId')}
            />
          )}

          {/* Password section */}
          <Switch
            label="Auto-generate password"
            description="A temporary password will be generated and displayed after creation"
            checked={autoGeneratePassword}
            onChange={(e) => setAutoGeneratePassword(e.currentTarget.checked)}
          />

          {!autoGeneratePassword && (
            <PasswordInput
              label="Password"
              placeholder="Enter password"
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
              color="green"
              loading={loading}
              disabled={!form.isValid()}
            >
              Create Coach
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}