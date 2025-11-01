import { Stack, Text, Button } from '@mantine/core';
import { IconFolderOff, IconPlus, IconFilterOff } from '@tabler/icons-react';

interface ActivityGroupEmptyStateProps {
  hasFilters: boolean;
  onAddGroup?: () => void;
  onClearFilters?: () => void;
}

export function ActivityGroupEmptyState({
  hasFilters,
  onAddGroup,
  onClearFilters,
}: ActivityGroupEmptyStateProps) {
  if (hasFilters) {
    return (
      <Stack align="center" gap="md" py="xl">
        <IconFilterOff size={48} stroke={1.5} color="#adb5bd" />
        <Stack align="center" gap="xs">
          <Text size="lg" fw={500}>
            No activity groups found
          </Text>
          <Text size="sm" c="dimmed">
            Try adjusting your search filters
          </Text>
        </Stack>
        {onClearFilters && (
          <Button variant="light" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </Stack>
    );
  }

  return (
    <Stack align="center" gap="md" py="xl">
      <IconFolderOff size={48} stroke={1.5} color="#adb5bd" />
      <Stack align="center" gap="xs">
        <Text size="lg" fw={500}>
          No activity groups yet
        </Text>
        <Text size="sm" c="dimmed">
          Create your first activity group to organize your templates
        </Text>
      </Stack>
      {onAddGroup && (
        <Button leftSection={<IconPlus size={16} />} onClick={onAddGroup} color="green">
          Add Your First Group
        </Button>
      )}
    </Stack>
  );
}