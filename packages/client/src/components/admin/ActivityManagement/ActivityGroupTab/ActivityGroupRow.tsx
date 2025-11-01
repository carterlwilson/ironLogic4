import { Table, Group, ActionIcon, Tooltip, Text } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import type { ActivityGroup } from '@ironlogic4/shared/types/activityGroups';

interface ActivityGroupRowProps {
  group: ActivityGroup;
  onEdit: (group: ActivityGroup) => void;
  onDelete: (group: ActivityGroup) => void;
}

export function ActivityGroupRow({ group, onEdit, onDelete }: ActivityGroupRowProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>{group.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed" lineClamp={2}>
          {group.notes || '-'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{formatDate(group.createdAt)}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Edit group">
            <ActionIcon
              variant="subtle"
              color="forestGreen"
              onClick={() => onEdit(group)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Delete group">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(group)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}