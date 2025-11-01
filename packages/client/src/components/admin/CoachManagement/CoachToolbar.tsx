import { Group, TextInput, Button, ActionIcon, Select } from '@mantine/core';
import { IconSearch, IconX, IconUserPlus } from '@tabler/icons-react';

interface CoachToolbarProps {
  searchQuery: string;
  gymId?: string;
  hasFilters: boolean;
  isAdmin: boolean;
  onSearchChange: (query: string) => void;
  onGymChange?: (gymId: string) => void;
  onClearFilters: () => void;
  onAddCoach: () => void;
  gymOptions?: Array<{ value: string; label: string }>;
  gymsLoading?: boolean;
}

export function CoachToolbar({
  searchQuery,
  gymId,
  hasFilters,
  isAdmin,
  onSearchChange,
  onGymChange,
  onClearFilters,
  onAddCoach,
  gymOptions = [],
  gymsLoading = false,
}: CoachToolbarProps) {
  return (
    <Group justify="space-between" gap="md">
      {/* Search and Filters */}
      <Group gap="md" style={{ flex: 1 }}>
        <TextInput
          placeholder="Search coaches by name or email..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery ? (
              <ActionIcon
                variant="subtle"
                onClick={() => onSearchChange('')}
                size="sm"
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 300 }}
        />

        {/* Gym filter - only for admin */}
        {isAdmin && onGymChange && (
          <Select
            placeholder="Filter by gym"
            data={gymOptions}
            value={gymId || null}
            onChange={(value) => onGymChange(value || '')}
            clearable
            searchable
            disabled={gymsLoading}
            style={{ minWidth: 200 }}
          />
        )}

        {/* Clear filters button */}
        {hasFilters && (
          <Button
            variant="light"
            color="gray"
            onClick={onClearFilters}
            leftSection={<IconX size={16} />}
          >
            Clear Filters
          </Button>
        )}
      </Group>

      {/* Add Coach Button */}
      <Button
        color="green"
        leftSection={<IconUserPlus size={16} />}
        onClick={onAddCoach}
      >
        Add Coach
      </Button>
    </Group>
  );
}