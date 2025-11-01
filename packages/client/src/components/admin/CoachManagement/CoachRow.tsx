import { Table, Group, ActionIcon, Tooltip, Text } from '@mantine/core';
import { IconEdit, IconTrash, IconLock } from '@tabler/icons-react';
import type { CoachResponse } from '@ironlogic4/shared/types/coaches';

interface CoachRowProps {
  coach: CoachResponse;
  isAdmin: boolean;
  gymName?: string;
  onEdit: (coach: CoachResponse) => void;
  onDelete: (coach: CoachResponse) => void;
  onResetPassword: (coach: CoachResponse) => void;
}

export function CoachRow({
  coach,
  isAdmin,
  gymName,
  onEdit,
  onDelete,
  onResetPassword,
}: CoachRowProps) {
  return (
    <Table.Tr>
      <Table.Td>
        <Text size="sm" fw={500}>
          {coach.firstName} {coach.lastName}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{coach.email}</Text>
      </Table.Td>
      {isAdmin && (
        <Table.Td>
          <Text size="sm">{gymName || 'Unknown'}</Text>
        </Table.Td>
      )}
      <Table.Td>
        <Text size="sm" c="dimmed">
          {new Date(coach.createdAt).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Edit coach">
            <ActionIcon
              variant="subtle"
              color="forestGreen"
              onClick={() => onEdit(coach)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Reset password">
            <ActionIcon
              variant="subtle"
              color="orange"
              onClick={() => onResetPassword(coach)}
            >
              <IconLock size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete coach">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(coach)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}