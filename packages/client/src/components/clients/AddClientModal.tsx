import { Modal, Stack, Group, TextInput, Button, Grid, Paper, Text, ActionIcon, Checkbox, PasswordInput, Alert, CopyButton, Tooltip, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconUser, IconRefresh, IconCopy, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import type { CreateClientRequest } from '../../services/clientApi';
import { generatePassword } from '../../utils/passwordGenerator';
import { useProgramOptions } from '../../hooks/useProgramOptions';

interface AddClientModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientRequest) => Promise<string | undefined>;
  loading?: boolean;
  gymId: string;
}

export function AddClientModal({ opened, onClose, onSubmit, loading = false, gymId }: AddClientModalProps) {
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const { options: programOptions, isLoading: programsLoading } = useProgramOptions(gymId);

  const form = useForm<CreateClientRequest>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      gymId: gymId,
      password: generatePassword(),
      generatePassword: true,
      programId: '',
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
      password: (value, values) => {
        if (!values.generatePassword && !value) return 'Password is required';
        if (!values.generatePassword && value && value.length < 8) return 'Password must be at least 8 characters';
        return null;
      },
    },
  });

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    form.setFieldValue('password', newPassword);
  };

  const handleAutoGenerateChange = (checked: boolean) => {
    setAutoGenerate(checked);
    form.setFieldValue('generatePassword', checked);
    if (checked) {
      const newPassword = generatePassword();
      form.setFieldValue('password', newPassword);
    }
  };

  const handleSubmit = async (values: CreateClientRequest) => {
    try {
      const password = await onSubmit(values);
      if (password) {
        setGeneratedPassword(password);
      }
      // Don't close the modal yet if password was generated
      if (!password) {
        form.reset();
        setGeneratedPassword(null);
        onClose();
      }
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    setGeneratedPassword(null);
    setAutoGenerate(true);
    onClose();
  };

  const handlePasswordShown = () => {
    form.reset();
    setGeneratedPassword(null);
    setAutoGenerate(true);
    onClose();
  };

  // Show generated password
  if (generatedPassword) {
    return (
      <Modal
        opened={opened}
        onClose={handlePasswordShown}
        title="Client Created Successfully"
        size="md"
        centered
      >
        <Stack gap="md">
          <Alert icon={<IconAlertCircle size={16} />} color="green">
            The client has been created successfully. Save this password securely.
          </Alert>

          <Paper p="md" withBorder>
            <Stack gap="sm">
              <Text size="sm" fw={500}>Generated Password</Text>
              <Group gap="xs">
                <TextInput
                  value={generatedPassword}
                  readOnly
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      fontFamily: 'monospace',
                      fontSize: '14px',
                    },
                  }}
                />
                <CopyButton value={generatedPassword}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy password'}>
                      <ActionIcon
                        color={copied ? 'green' : 'forestGreen'}
                        onClick={copy}
                        variant="light"
                        size="lg"
                      >
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
              <Text size="xs" c="dimmed">
                This password will not be shown again. Make sure to save it securely.
              </Text>
            </Stack>
          </Paper>

          <Button onClick={handlePasswordShown} color="green" fullWidth>
            Done
          </Button>
        </Stack>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add New Client"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
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

          <TextInput
            label="Email"
            placeholder="client@example.com"
            leftSection={<IconMail size={16} />}
            type="email"
            required
            {...form.getInputProps('email')}
          />

          <Select
            label="Program"
            placeholder="Select a program (optional)"
            data={programOptions}
            searchable
            clearable
            disabled={programsLoading}
            {...form.getInputProps('programId')}
          />

          <Stack gap="xs">
            <Checkbox
              label="Auto-generate password"
              checked={autoGenerate}
              onChange={(e) => handleAutoGenerateChange(e.currentTarget.checked)}
            />

            {autoGenerate ? (
              <Group gap="xs">
                <TextInput
                  label="Password"
                  value={form.values.password}
                  readOnly
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      fontFamily: 'monospace',
                      fontSize: '14px',
                    },
                  }}
                />
                <Tooltip label="Generate new password">
                  <ActionIcon
                    onClick={handleGeneratePassword}
                    variant="light"
                    color="forestGreen"
                    size="lg"
                    style={{ marginTop: 25 }}
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ) : (
              <PasswordInput
                label="Password"
                placeholder="Enter password (min 8 characters)"
                required
                {...form.getInputProps('password')}
              />
            )}
          </Stack>

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
            >
              Create Client
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}