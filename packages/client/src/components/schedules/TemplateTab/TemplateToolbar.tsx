import { Group, TextInput, Button } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';

interface TemplateToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddTemplate: () => void;
}

export function TemplateToolbar({
  searchQuery,
  onSearchChange,
  onAddTemplate,
}: TemplateToolbarProps) {
  return (
    <Group justify="space-between">
      <TextInput
        placeholder="Search by coach or day..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        w={260}
      />
      <Button leftSection={<IconPlus size={16} />} onClick={onAddTemplate}>
        Add Template
      </Button>
    </Group>
  );
}
