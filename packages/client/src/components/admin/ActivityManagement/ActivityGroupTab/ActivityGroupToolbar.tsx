import { Group, TextInput, Button, ActionIcon } from '@mantine/core';
import { IconSearch, IconPlus, IconX } from '@tabler/icons-react';

interface ActivityGroupToolbarProps {
  searchQuery: string;
  hasFilters: boolean;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  onAddGroup: () => void;
}

export function ActivityGroupToolbar({
  searchQuery,
  hasFilters,
  onSearchChange,
  onClearFilters,
  onAddGroup,
}: ActivityGroupToolbarProps) {
  return (
    <Group justify="space-between" align="flex-end">
      <Group gap="md" style={{ flex: 1 }}>
        <TextInput
          placeholder="Search activity groups..."
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery ? (
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => onSearchChange('')}
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          style={{ minWidth: 300 }}
        />

        {hasFilters && (
          <Button
            variant="subtle"
            onClick={onClearFilters}
            leftSection={<IconX size={16} />}
          >
            Clear Filters
          </Button>
        )}
      </Group>

      <Button
        leftSection={<IconPlus size={16} />}
        onClick={onAddGroup}
        color="green"
      >
        Add Group
      </Button>
    </Group>
  );
}