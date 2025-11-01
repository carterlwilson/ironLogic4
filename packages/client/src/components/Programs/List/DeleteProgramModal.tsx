import { Modal, Text, Group, Button, Stack } from '@mantine/core';
import { useDeleteProgram } from '../../../hooks/usePrograms';
import type { IProgram } from '@ironlogic4/shared/types/programs';

interface DeleteProgramModalProps {
  opened: boolean;
  onClose: () => void;
  program: IProgram | null;
}

export function DeleteProgramModal({ opened, onClose, program }: DeleteProgramModalProps) {
  const deleteProgram = useDeleteProgram();

  const handleDelete = async () => {
    if (!program) return;

    try {
      await deleteProgram.mutateAsync(program.id);
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Delete Program" size="md">
      <Stack gap="md">
        <Text>
          Are you sure you want to delete <strong>{program?.name}</strong>?
        </Text>
        <Text size="sm" c="dimmed">
          This will permanently delete the program and all its blocks, weeks, days, and activities. This action cannot be undone.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={deleteProgram.isPending}>
            Delete Program
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}