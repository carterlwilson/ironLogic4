import { Badge } from '@mantine/core';
import type { UserType } from '@ironlogic4/shared/types/users';

interface UserBadgeProps {
  role: UserType;
}

const getRoleConfig = (role: UserType) => {
  switch (role) {
    case 'admin':
      return {
        color: 'red',
        label: 'Admin',
      };
    case 'owner':
      return {
        color: 'purple',
        label: 'Owner',
      };
    case 'coach':
      return {
        color: 'blue',
        label: 'Coach',
      };
    case 'client':
      return {
        color: 'gray',
        label: 'Client',
      };
    default:
      return {
        color: 'gray',
        label: 'Unknown',
      };
  }
};

export function UserBadge({ role }: UserBadgeProps) {
  const config = getRoleConfig(role);

  return (
    <Badge
      color={config.color}
      variant="light"
      size="sm"
      radius="sm"
    >
      {config.label}
    </Badge>
  );
}