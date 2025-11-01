import { Group, TextInput, Button } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';

interface TemplateToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddTemplate: () => void;
}

/**
 * Toolbar for schedule templates with search and create actions
 */
export function TemplateToolbar({
  searchQuery,
  onSearchChange,
  onAddTemplate,
}: TemplateToolbarProps) {
  return (
    <Group justify="space-between">
      <TextInput
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        leftSection={<IconSearch size={16} />}
        style={{ flex: 1, maxWidth: 400 }}
      />
      <Button leftSection={<IconPlus size={16} />} onClick={onAddTemplate}>
        Create Template
      </Button>
    </Group>
  );
}