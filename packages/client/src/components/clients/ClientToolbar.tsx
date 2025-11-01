import { Group, TextInput, Button } from '@mantine/core';
import { IconSearch, IconPlus } from '@tabler/icons-react';

interface ClientToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddClient: () => void;
}

export function ClientToolbar({ searchQuery, onSearchChange, onAddClient }: ClientToolbarProps) {
  return (
    <Group justify="space-between" mb="md">
      <TextInput
        placeholder="Search by name or email..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        style={{ flex: 1, maxWidth: 400 }}
      />

      <Button
        leftSection={<IconPlus size={16} />}
        color="green"
        onClick={onAddClient}
      >
        Add Client
      </Button>
    </Group>
  );
}