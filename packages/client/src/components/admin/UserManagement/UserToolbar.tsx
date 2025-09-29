import { Group, TextInput, Select, Button } from '@mantine/core';
import { IconSearch, IconUserPlus, IconX } from '@tabler/icons-react';

interface UserToolbarProps {
  searchQuery: string;
  roleFilter: string;
  hasFilters: boolean;
  onSearchChange: (query: string) => void;
  onRoleFilterChange: (role: string) => void;
  onClearFilters: () => void;
  onAddUser: () => void;
}

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
  { value: 'coach', label: 'Coach' },
  { value: 'client', label: 'Client' },
];

export function UserToolbar({
  searchQuery,
  roleFilter,
  hasFilters,
  onSearchChange,
  onRoleFilterChange,
  onClearFilters,
  onAddUser,
}: UserToolbarProps) {
  return (
    <Group justify="space-between" mb="md">
      <Group gap="md">
        <TextInput
          placeholder="Search users..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          style={{ width: 400 }}
        />

        <Select
          placeholder="Filter by role"
          value={roleFilter}
          onChange={(value) => onRoleFilterChange(value || '')}
          data={roleOptions}
          style={{ width: 160 }}
          clearable
        />

        {hasFilters && (
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconX size={16} />}
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </Group>

      <Button
        leftSection={<IconUserPlus size={16} />}
        color="green"
        onClick={onAddUser}
      >
        Add User
      </Button>
    </Group>
  );
}