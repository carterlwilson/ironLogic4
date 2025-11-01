import { Group, Button } from '@mantine/core';
import { IconPlus, IconEdit, IconRefresh, IconTrash } from '@tabler/icons-react';

interface ActiveToolbarProps {
  hasActiveSchedule: boolean;
  onCreateFromTemplate: () => void;
  onEditCoaches: () => void;
  onReset: () => void;
  onDelete: () => void;
}

/**
 * Toolbar for active schedule with management actions
 */
export function ActiveToolbar({
  hasActiveSchedule,
  onCreateFromTemplate,
  onEditCoaches,
  onReset,
  onDelete,
}: ActiveToolbarProps) {
  if (!hasActiveSchedule) {
    return (
      <Group justify="flex-end">
        <Button leftSection={<IconPlus size={16} />} onClick={onCreateFromTemplate}>
          Create from Template
        </Button>
      </Group>
    );
  }

  return (
    <Group justify="flex-end">
      <Button
        variant="light"
        leftSection={<IconEdit size={16} />}
        onClick={onEditCoaches}
      >
        Edit Coaches
      </Button>
      <Button
        variant="light"
        color="orange"
        leftSection={<IconRefresh size={16} />}
        onClick={onReset}
      >
        Reset Schedule
      </Button>
      <Button
        variant="light"
        color="red"
        leftSection={<IconTrash size={16} />}
        onClick={onDelete}
      >
        Delete Schedule
      </Button>
    </Group>
  );
}