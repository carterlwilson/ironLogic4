import { Group, TextInput, Select, Button } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';

interface ProgramToolbarProps {
  onSearch: (search: string) => void;
  onFilterChange: (filters: { isActive?: boolean; gymId?: string }) => void;
  onCreateProgram: () => void;
  searchValue: string;
  isActiveFilter?: boolean;
}

export function ProgramToolbar({
  onSearch,
  onFilterChange,
  onCreateProgram,
  searchValue,
  isActiveFilter,
}: ProgramToolbarProps) {
  return (
    <Group justify="space-between">
      <Group>
        <TextInput
          placeholder="Search programs..."
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(e) => onSearch(e.currentTarget.value)}
          style={{ width: 300 }}
        />

        <Select
          placeholder="Status"
          data={[
            { value: 'all', label: 'All Programs' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          value={
            isActiveFilter === undefined
              ? 'all'
              : isActiveFilter
              ? 'active'
              : 'inactive'
          }
          onChange={(value) => {
            if (value === 'all') {
              onFilterChange({ isActive: undefined });
            } else {
              onFilterChange({ isActive: value === 'active' });
            }
          }}
          clearable={false}
          style={{ width: 150 }}
        />
      </Group>

      <Button leftSection={<IconPlus size={16} />} onClick={onCreateProgram}>
        Create Program
      </Button>
    </Group>
  );
}