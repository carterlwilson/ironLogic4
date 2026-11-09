import { useState } from 'react';
import { Modal, Text, Group, Button, Stack, Alert, TextInput, List } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useAssignProgramToAllClients } from '../../../hooks/usePrograms';
import type { IProgram } from '@ironlogic4/shared/types/programs';

interface AssignProgramToAllModalProps {
  opened: boolean;
  onClose: () => void;
  program: IProgram | null;
}

export function AssignProgramToAllModal({ opened, onClose, program }: AssignProgramToAllModalProps) {
  const assignToAll = useAssignProgramToAllClients();
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const handleAssign = async () => {
    if (!program) return;

    try {
      await assignToAll.mutateAsync(program.id);
      handleClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isConfirmed = !!program && confirmText.trim() === program.name.trim();

  return (
    <Modal opened={opened} onClose={handleClose} title="Assign Program to All Clients" size="lg">
      <Stack gap="md">
        <Alert color="red" variant="light" icon={<IconAlertTriangle size={20} />} title="This affects every client in your gym">
          <List size="sm" spacing="xs">
            <List.Item>
              Every client in this gym will be switched to <strong>{program?.name}</strong>.
            </List.Item>
            <List.Item>
              Whatever program each client is currently on will be replaced. This includes clients who are on a different program on purpose.
            </List.Item>
            <List.Item>
              Clients will immediately see this program's workouts.
            </List.Item>
            <List.Item>
              There is no undo. To revert, you would have to reassign clients one by one, or use this button on another program (which again moves everyone).
            </List.Item>
          </List>
        </Alert>

        <TextInput
          label={
            <Text size="sm" component="span">
              To confirm, type the program name: <strong>{program?.name}</strong>
            </Text>
          }
          value={confirmText}
          onChange={(e) => setConfirmText(e.currentTarget.value)}
          placeholder={program?.name}
          data-autofocus
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleAssign}
            loading={assignToAll.isPending}
            disabled={!isConfirmed}
          >
            Switch all clients
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
