import { Modal, Stack, Group, TextInput, Button, Grid, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconUser } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { User } from '@ironlogic4/shared/types/users';
import type { UpdateClientRequest } from '../../services/clientApi';
import { useProgramOptions } from '../../hooks/useProgramOptions';

interface EditClientModalProps {
  opened: boolean;
  onClose: () => void;
  client: User | null;
  onSubmit: (id: string, data: UpdateClientRequest) => Promise<void>;
  onAssignProgram: (clientId: string, programId: string) => Promise<void>;
  onUnassignProgram: (clientId: string) => Promise<void>;
  loading?: boolean;
}

export function EditClientModal({ opened, onClose, client, onSubmit, onAssignProgram, onUnassignProgram, loading = false }: EditClientModalProps) {
  const [initialProgramId, setInitialProgramId] = useState<string | undefined>(undefined);
  const [programId, setProgramId] = useState<string>('');
  const { options: programOptions, isLoading: programsLoading } = useProgramOptions(client?.gymId);

  const form = useForm<UpdateClientRequest>({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    validate: {
      firstName: (value) => {
        if (value && !value.trim()) return 'First name cannot be empty';
        if (value && value.trim().length < 1) return 'First name must be at least 1 character';
        return null;
      },
      lastName: (value) => {
        if (value && !value.trim()) return 'Last name cannot be empty';
        if (value && value.trim().length < 1) return 'Last name must be at least 1 character';
        return null;
      },
      email: (value) => {
        if (value && !/^\S+@\S+\.\S+$/.test(value)) return 'Please enter a valid email address';
        return null;
      },
    },
  });

  useEffect(() => {
    if (client) {
      form.setValues({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
      });
      setInitialProgramId(client.programId);
      setProgramId(client.programId || '');
    }
  }, [client]);

  const handleSubmit = async (values: UpdateClientRequest) => {
    if (!client) return;

    try {
      // Update basic client info
      await onSubmit(client.id, values);

      // Handle program assignment changes
      const hasInitialProgram = initialProgramId && initialProgramId !== '';
      const hasNewProgram = programId && programId !== '';

      if (hasInitialProgram && !hasNewProgram) {
        // Unassign program
        await onUnassignProgram(client.id);
      } else if (!hasInitialProgram && hasNewProgram) {
        // Assign new program
        await onAssignProgram(client.id, programId);
      } else if (hasInitialProgram && hasNewProgram && initialProgramId !== programId) {
        // Change program (assign new one)
        await onAssignProgram(client.id, programId);
      }

      form.reset();
      setInitialProgramId(undefined);
      setProgramId('');
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    setInitialProgramId(undefined);
    setProgramId('');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Client"
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
            value={programId}
            onChange={(value) => setProgramId(value || '')}
            searchable
            clearable
            disabled={programsLoading}
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
              color="forestGreen"
              loading={loading}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}