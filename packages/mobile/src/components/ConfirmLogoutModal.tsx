import { Modal, Button, Group, Text } from '@mantine/core';

interface ConfirmLogoutModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmLogoutModal({ opened, onClose, onConfirm }: ConfirmLogoutModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Confirm Logout"
      size="sm"
      centered
    >
      <Text mb="lg">Are you sure you want to log out?</Text>

      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="filled" color="red" onClick={onConfirm}>
          Logout
        </Button>
      </Group>
    </Modal>
  );
}