import { Group, TextInput, Select, Button } from '@mantine/core';
import { IconSearch, IconPlus, IconX, IconUser } from '@tabler/icons-react';

interface GymToolbarProps {
  searchQuery: string;
  ownerFilter: string;
  hasFilters: boolean;
  ownerOptions: Array<{ value: string; label: string }>;
  ownersLoading: boolean;
  onSearchChange: (query: string) => void;
  onOwnerFilterChange: (ownerId: string) => void;
  onClearFilters: () => void;
  onAddGym: () => void;
}

export function GymToolbar({
  searchQuery,
  ownerFilter,
  hasFilters,
  ownerOptions,
  ownersLoading,
  onSearchChange,
  onOwnerFilterChange,
  onClearFilters,
  onAddGym,
}: GymToolbarProps) {

  return (
    <Group justify="space-between" mb="md">
      <Group gap="md">
        <TextInput
          placeholder="Search gyms..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          style={{ width: 400 }}
        />

        <Select
          placeholder="Filter by owner"
          value={ownerFilter}
          onChange={(value) => onOwnerFilterChange(value || '')}
          data={ownerOptions}
          leftSection={<IconUser size={16} />}
          style={{ width: 200 }}
          clearable
          disabled={ownersLoading}
          searchable
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
        leftSection={<IconPlus size={16} />}
        color="green"
        onClick={onAddGym}
      >
        Add Gym
      </Button>
    </Group>
  );
}