import { Modal, Stack, Group, TextInput, Select, PasswordInput, Button, Grid } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconUser, IconLock } from '@tabler/icons-react';
import type { CreateUserRequest } from '../../../services/userApi';
import type { GymOption } from '../../../hooks/useGymOptions';

interface AddUserModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
  loading?: boolean;
  gymOptions: GymOption[];
  gymsLoading: boolean;
}

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
  { value: 'coach', label: 'Coach' },
  { value: 'client', label: 'Client' },
];

export function AddUserModal({ opened, onClose, onSubmit, loading = false, gymOptions, gymsLoading }: AddUserModalProps) {

  const form = useForm<CreateUserRequest>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      userType: 'client' as any,
      password: '',
      gymId: '',
    },
    validate: {
      firstName: (value) => {
        if (!value?.trim()) return 'First name is required';
        if (value.trim().length < 1) return 'First name must be at least 1 character';
        return null;
      },
      lastName: (value) => {
        if (!value?.trim()) return 'Last name is required';
        if (value.trim().length < 1) return 'Last name must be at least 1 character';
        return null;
      },
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Please enter a valid email address';
        return null;
      },
      userType: (value) => {
        if (!value) return 'Role is required';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
    },
  });

  const handleSubmit = async (values: CreateUserRequest) => {
    try {
      await onSubmit(values);
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
      title="Add New User"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Personal Information */}
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="First Name"
                placeholder="Enter first name"
                leftSection={<IconUser size={16} />}
                required
                {...form.getInputProps('firstName')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Last Name"
                placeholder="Enter last name"
                leftSection={<IconUser size={16} />}
                required
                {...form.getInputProps('lastName')}
              />
            </Grid.Col>
          </Grid>

          {/* Account Information */}
          <TextInput
            label="Email"
            placeholder="user@company.com"
            leftSection={<IconMail size={16} />}
            type="email"
            required
            {...form.getInputProps('email')}
          />

          <Select
            label="Role"
            placeholder="Select user role"
            data={roleOptions}
            required
            {...form.getInputProps('userType')}
          />

          <Select
            label="Gym"
            placeholder="Select gym (optional)"
            data={gymOptions}
            disabled={gymsLoading}
            searchable
            clearable
            {...form.getInputProps('gymId')}
          />

          <PasswordInput
            label="Password"
            placeholder="Enter password"
            leftSection={<IconLock size={16} />}
            required
            {...form.getInputProps('password')}
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
              Create User
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}