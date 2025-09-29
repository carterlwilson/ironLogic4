import { Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash, IconPhone, IconUser } from '@tabler/icons-react';
import type { Gym } from '@ironlogic4/shared/types/gyms';
import type { OwnerMapping } from '../../../hooks/useOwnerMapping';

interface GymRowProps {
  gym: Gym;
  ownerMapping: OwnerMapping;
  onEdit: (gym: Gym) => void;
  onDelete: (gym: Gym) => void;
}

export function GymRow({ gym, ownerMapping, onEdit, onDelete }: GymRowProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get owner name from mapping
  const getOwnerName = (): string => {
    if (!gym.ownerId) {
      return 'No owner assigned';
    }
    return ownerMapping[gym.ownerId] || 'Owner not found';
  };

  const ownerName = getOwnerName();

  return (
    <tr>
      <td>
        <Text fw={500}>{gym.name}</Text>
      </td>
      <td>
        <Text size="sm" c="dimmed" style={{ maxWidth: 200 }} truncate>
          {gym.address}
        </Text>
      </td>
      <td>
        <Group gap="xs">
          <IconPhone size={14} />
          <Text
            component="a"
            href={`tel:${gym.phoneNumber}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
            c="blue"
            size="sm"
          >
            {gym.phoneNumber}
          </Text>
        </Group>
      </td>
      <td>
        <Group gap="xs">
          <IconUser size={14} />
          <Text size="sm">
            {ownerName}
          </Text>
        </Group>
      </td>
      <td>
        <Text size="sm" c="dimmed">
          {formatDate(gym.createdAt)}
        </Text>
      </td>
      <td>
        <Group gap="xs">
          <Tooltip label="Edit gym">
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => onEdit(gym)}
            >
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Delete gym">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(gym)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </td>
    </tr>
  );
}