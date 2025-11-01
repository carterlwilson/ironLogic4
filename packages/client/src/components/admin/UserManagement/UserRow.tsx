import { Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { User } from '@ironlogic4/shared/types/users';
import { UserBadge } from './UserBadge';

interface UserRowProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserRow({ user, onEdit, onDelete }: UserRowProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <tr>
      <td>
        <Text fw={500}>{fullName}</Text>
      </td>
      <td>
        <Text
          component="a"
          href={`mailto:${user.email}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
          c="forestGreen"
        >
          {user.email}
        </Text>
      </td>
      <td>
        <UserBadge role={user.userType} />
      </td>
      <td>
        <Text size="sm" c="dimmed">
          {formatDate(user.createdAt)}
        </Text>
      </td>
      <td>
        <Group gap="xs">
          <Tooltip label="Edit user">
            <ActionIcon
              variant="subtle"
              color="forestGreen"
              onClick={() => onEdit(user)}
            >
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Delete user">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(user)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </td>
    </tr>
  );
}