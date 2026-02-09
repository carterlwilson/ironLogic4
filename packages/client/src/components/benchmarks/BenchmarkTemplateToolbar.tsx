import { Group, TextInput, Button, Select } from '@mantine/core';
import { IconSearch, IconPlus, IconFilterOff } from '@tabler/icons-react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';

interface BenchmarkTemplateToolbarProps {
  searchQuery: string;
  typeFilter: BenchmarkType | '';
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: BenchmarkType | '') => void;
  onClearFilters: () => void;
  onAddTemplate: () => void;
}

const typeFilterOptions = [
  { value: '', label: 'All Types' },
  { value: BenchmarkType.WEIGHT, label: 'Weight' },
  { value: BenchmarkType.TIME, label: 'Time' },
  { value: BenchmarkType.DISTANCE, label: 'Distance' },
  { value: BenchmarkType.REPS, label: 'Reps' },
  { value: BenchmarkType.OTHER, label: 'Other' },
];

export function BenchmarkTemplateToolbar({
  searchQuery,
  typeFilter,
  hasFilters,
  onSearchChange,
  onTypeFilterChange,
  onClearFilters,
  onAddTemplate,
}: BenchmarkTemplateToolbarProps) {
  return (
    <Group gap="md" wrap="nowrap">
      <TextInput
        placeholder="Search templates..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        style={{ flex: 1 }}
      />

      <Select
        placeholder="Filter by type"
        data={typeFilterOptions}
        value={typeFilter}
        onChange={(value) => onTypeFilterChange((value as BenchmarkType) || '')}
        w={150}
        clearable={false}
      />

      {hasFilters && (
        <Button
          variant="subtle"
          leftSection={<IconFilterOff size={16} />}
          onClick={onClearFilters}
        >
          Clear
        </Button>
      )}

      <Button
        color="green"
        leftSection={<IconPlus size={16} />}
        onClick={onAddTemplate}
      >
        Add Template
      </Button>
    </Group>
  );
}