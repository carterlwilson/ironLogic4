import { Group, TextInput, Button, ActionIcon, Select } from '@mantine/core';
import { IconSearch, IconPlus, IconX } from '@tabler/icons-react';
import type { ActivityGroupOption } from '../../../../hooks/useActivityGroupOptions';
import { ActivityType } from '@ironlogic4/shared/types/activityTemplates';

interface ActivityTemplateToolbarProps {
  searchQuery: string;
  typeFilter: ActivityType | '';
  groupFilter: string;
  hasFilters: boolean;
  onSearchChange: (query: string) => void;
  onTypeFilterChange: (type: ActivityType | '') => void;
  onGroupFilterChange: (groupId: string) => void;
  onClearFilters: () => void;
  onAddTemplate: () => void;
  groupOptions: ActivityGroupOption[];
  groupsLoading: boolean;
}

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: ActivityType.LIFT, label: 'Lift' },
  { value: ActivityType.CARDIO, label: 'Cardio' },
  { value: ActivityType.BENCHMARK, label: 'Benchmark' },
  { value: ActivityType.OTHER, label: 'Other' },
];

export function ActivityTemplateToolbar({
  searchQuery,
  typeFilter,
  groupFilter,
  hasFilters,
  onSearchChange,
  onTypeFilterChange,
  onGroupFilterChange,
  onClearFilters,
  onAddTemplate,
  groupOptions,
  groupsLoading,
}: ActivityTemplateToolbarProps) {
  return (
    <Group justify="space-between" align="flex-end">
      <Group gap="md" style={{ flex: 1 }}>
        <TextInput
          placeholder="Search activity templates..."
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

        <Select
          placeholder="Filter by type"
          data={typeOptions}
          value={typeFilter}
          onChange={(value) => onTypeFilterChange((value || '') as ActivityType | '')}
          clearable
          style={{ minWidth: 150 }}
        />

        <Select
          placeholder="Filter by group"
          data={groupOptions}
          value={groupFilter}
          onChange={(value) => onGroupFilterChange(value || '')}
          disabled={groupsLoading}
          clearable
          searchable
          style={{ minWidth: 200 }}
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
        onClick={onAddTemplate}
        color="green"
      >
        Add Template
      </Button>
    </Group>
  );
}