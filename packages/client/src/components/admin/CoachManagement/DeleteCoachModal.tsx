import { Modal, Stack, Group, Text, Button, Alert, List } from '@mantine/core';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import type { CoachResponse } from '@ironlogic4/shared/types/coaches';

interface DeleteCoachModalProps {
  opened: boolean;
  onClose: () => void;
  coach: CoachResponse | null;
  onConfirm: (coach: CoachResponse) => Promise<void>;
  loading?: boolean;
}

interface DependencyError {
  status: number;
  message: string;
  dependencies?: {
    clients?: number;
    programs?: number;
    [key: string]: any;
  };
}

export function DeleteCoachModal({
  opened,
  onClose,
  coach,
  onConfirm,
  loading = false,
}: DeleteCoachModalProps) {
  const [dependencyError, setDependencyError] = useState<DependencyError | null>(null);

  const handleConfirm = async () => {
    if (!coach) return;

    try {
      setDependencyError(null);
      await onConfirm(coach);
      onClose();
    } catch (error: any) {
      // Check if it's a dependency error (409 Conflict)
      if (error.status === 409) {
        setDependencyError(error);
      }
      // Other errors are handled by parent component
    }
  };

  const handleClose = () => {
    setDependencyError(null);
    onClose();
  };

  if (!coach) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Delete Coach"
      size="md"
      centered
    >
      <Stack gap="md">
        {dependencyError ? (
          <>
            {/* Dependency error message */}
            <Alert
              icon={<IconAlertTriangle size={16} />}
              title="Cannot Delete Coach"
              color="red"
            >
              <Stack gap="sm">
                <Text size="sm">
                  {dependencyError.message || 'This coach cannot be deleted because it has dependencies.'}
                </Text>

                {dependencyError.dependencies && (
                  <List size="sm">
                    {(dependencyError.dependencies.clients ?? 0) > 0 && (
                      <List.Item>
                        {dependencyError.dependencies.clients} client{dependencyError.dependencies.clients !== 1 ? 's' : ''}
                      </List.Item>
                    )}
                    {(dependencyError.dependencies.programs ?? 0) > 0 && (
                      <List.Item>
                        {dependencyError.dependencies.programs} program{dependencyError.dependencies.programs !== 1 ? 's' : ''}
                      </List.Item>
                    )}
                  </List>
                )}

                <Text size="sm" c="dimmed">
                  Please reassign or delete these items before deleting this coach.
                </Text>
              </Stack>
            </Alert>

            {/* Close button */}
            <Group justify="flex-end" gap="md">
              <Button onClick={handleClose}>
                Close
              </Button>
            </Group>
          </>
        ) : (
          <>
            {/* Confirmation message */}
            <Alert
              icon={<IconAlertTriangle size={16} />}
              title="Confirm Deletion"
              color="orange"
            >
              <Text size="sm">
                Are you sure you want to delete coach{' '}
                <strong>{coach.firstName} {coach.lastName}</strong>?
              </Text>
              <Text size="sm" mt="xs">
                This action cannot be undone.
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
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleConfirm}
                loading={loading}
              >
                Delete Coach
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}