import { Modal, Stack, TextInput, Textarea, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCreateProgram } from '../../../hooks/usePrograms';
import { useAuth } from '../../../providers/AuthProvider';
import type { CreateProgramRequest } from '@ironlogic4/shared/types/programs';

interface CreateProgramModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CreateProgramModal({ opened, onClose }: CreateProgramModalProps) {
  const { user } = useAuth();
  const createProgram = useCreateProgram();

  const form = useForm<CreateProgramRequest>({
    initialValues: {
      name: '',
      description: '',
      gymId: user?.gymId || '',
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      gymId: (value) => (!value ? 'Gym is required' : null),
    },
  });

  const handleSubmit = async (values: CreateProgramRequest) => {
    try {
      await createProgram.mutateAsync(values);
      form.reset();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Create Program" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Program Name"
            placeholder="Enter program name"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="Enter program description (optional)"
            rows={4}
            {...form.getInputProps('description')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createProgram.isPending}>
              Create Program
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}