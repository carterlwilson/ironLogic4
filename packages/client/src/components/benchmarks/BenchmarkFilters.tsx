import { Paper, TextInput, MultiSelect, Group, Select } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface BenchmarkFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTags: string[];
  onTagsChange: (values: string[]) => void;
  availableTags: string[];
  sortBy: 'name' | 'date' | 'type';
  onSortChange: (value: 'name' | 'date' | 'type') => void;
}

export function BenchmarkFilters({
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagsChange,
  availableTags,
  sortBy,
  onSortChange,
}: BenchmarkFiltersProps) {
  const tagOptions = availableTags.map((tag) => ({
    value: tag,
    label: tag,
  }));

  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'date', label: 'Date (Newest First)' },
    { value: 'type', label: 'Type' },
  ];

  return (
    <Paper p="md" withBorder>
      <Group grow align="flex-start">
        <TextInput
          placeholder="Search by name..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
        />

        <MultiSelect
          placeholder="Filter by tags..."
          data={tagOptions}
          value={selectedTags}
          onChange={onTagsChange}
          searchable
          clearable
          maxDropdownHeight={200}
        />

        <Select
          placeholder="Sort by..."
          data={sortOptions}
          value={sortBy}
          onChange={(value) => onSortChange(value as 'name' | 'date' | 'type')}
          clearable={false}
        />
      </Group>
    </Paper>
  );
}