import { Modal, Tabs, Stack, Group, TextInput, Select, PasswordInput, Button, Grid, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconUser, IconLock, IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import React, { useState } from 'react';
import type { User } from '@ironlogic4/shared/types/users';
import type { UpdateUserRequest } from '../../../services/userApi';
import type { GymOption } from '../../../hooks/useGymOptions';

interface EditUserModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (userId: string, data: UpdateUserRequest) => Promise<void>;
  onDelete: (user: User) => void;
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

export function EditUserModal({ opened, onClose, user, onSubmit, onDelete, loading = false, gymOptions, gymsLoading }: EditUserModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>('info');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const form = useForm<UpdateUserRequest>({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      userType: user?.userType || 'client' as any,
      gymId: user?.gymId || '',
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
    },
  });

  const passwordForm = useForm({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      newPassword: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm the password';
        if (value !== values.newPassword) return 'Passwords do not match';
        return null;
      },
    },
  });

  // Reset forms when user changes
  React.useEffect(() => {
    if (user) {
      form.setValues({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        gymId: user.gymId || '',
      });
      form.resetDirty();
    }
    passwordForm.reset();
    setActiveTab('info');
  }, [user]);

  const handleSubmit = async (values: UpdateUserRequest) => {
    if (!user) return;

    try {
      await onSubmit(user.id, values);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handlePasswordReset = async (values: { newPassword: string; confirmPassword: string }) => {
    if (!user) return;

    setPasswordLoading(true);
    try {
      await onSubmit(user.id, { password: values.newPassword });
      passwordForm.reset();
      // Success notification would be handled by parent
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    passwordForm.reset();
    setActiveTab('info');
    onClose();
  };

  const handleDelete = () => {
    if (user) {
      onDelete(user);
    }
  };

  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Edit User: ${fullName}`}
      size="md"
      centered
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="info">User Information</Tabs.Tab>
          <Tabs.Tab value="password">Password</Tabs.Tab>
          <Tabs.Tab value="danger">Danger Zone</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="info" pt="md">
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
                  color="forestGreen"
                  loading={loading}
                  disabled={!form.isValid() || !form.isDirty()}
                >
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="password" pt="md">
          <form onSubmit={passwordForm.onSubmit(handlePasswordReset)}>
            <Stack gap="md">
              <Alert color="forestGreen" title="Password Reset">
                Enter a new password for this user. They will need to use this password on their next login.
              </Alert>

              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                leftSection={<IconLock size={16} />}
                required
                {...passwordForm.getInputProps('newPassword')}
              />

              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm new password"
                leftSection={<IconLock size={16} />}
                required
                {...passwordForm.getInputProps('confirmPassword')}
              />

              {/* Actions */}
              <Group justify="flex-end" gap="md" mt="md">
                <Button
                  variant="subtle"
                  onClick={() => passwordForm.reset()}
                  disabled={passwordLoading}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  color="orange"
                  loading={passwordLoading}
                  disabled={!passwordForm.isValid()}
                >
                  Reset Password
                </Button>
              </Group>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="danger" pt="md">
          <Stack gap="md">
            <Alert
              color="red"
              icon={<IconAlertTriangle size={16} />}
              title="Danger Zone"
            >
              <Text size="sm">
                Once you delete this user, there is no going back. This action cannot be undone.
              </Text>
            </Alert>

            <Stack gap="xs">
              <Text fw={500}>Delete User Account</Text>
              <Text size="sm" c="dimmed">
                This will permanently delete {fullName}'s account and remove all associated data.
                This action cannot be undone.
              </Text>
            </Stack>

            <Group justify="flex-end">
              <Button
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleDelete}
              >
                Delete User Account
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}