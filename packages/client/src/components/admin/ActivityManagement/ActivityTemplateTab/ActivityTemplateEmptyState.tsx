import { Stack, Text, Button } from '@mantine/core';
import { IconListDetails, IconPlus, IconFilterOff } from '@tabler/icons-react';

interface ActivityTemplateEmptyStateProps {
  hasFilters: boolean;
  onAddTemplate?: () => void;
  onClearFilters?: () => void;
}

export function ActivityTemplateEmptyState({
  hasFilters,
  onAddTemplate,
  onClearFilters,
}: ActivityTemplateEmptyStateProps) {
  if (hasFilters) {
    return (
      <Stack align="center" gap="md" py="xl">
        <IconFilterOff size={48} stroke={1.5} color="#adb5bd" />
        <Stack align="center" gap="xs">
          <Text size="lg" fw={500}>
            No activity templates found
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
      <IconListDetails size={48} stroke={1.5} color="#adb5bd" />
      <Stack align="center" gap="xs">
        <Text size="lg" fw={500}>
          No activity templates yet
        </Text>
        <Text size="sm" c="dimmed">
          Create your first activity template to get started
        </Text>
      </Stack>
      {onAddTemplate && (
        <Button leftSection={<IconPlus size={16} />} onClick={onAddTemplate} color="green">
          Add Your First Template
        </Button>
      )}
    </Stack>
  );
}