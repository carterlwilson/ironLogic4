import { Stack, Text, Button } from '@mantine/core';
import { IconPlus, IconFilterOff } from '@tabler/icons-react';

interface BenchmarkTemplateEmptyStateProps {
  hasFilters: boolean;
  onAddTemplate?: () => void;
  onClearFilters?: () => void;
}

export function BenchmarkTemplateEmptyState({
  hasFilters,
  onAddTemplate,
  onClearFilters,
}: BenchmarkTemplateEmptyStateProps) {
  if (hasFilters) {
    return (
      <Stack align="center" gap="md" py="xl">
        <Text size="lg" c="dimmed">
          No benchmark templates found matching your filters.
        </Text>
        {onClearFilters && (
          <Button
            variant="subtle"
            leftSection={<IconFilterOff size={16} />}
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </Stack>
    );
  }

  return (
    <Stack align="center" gap="md" py="xl">
      <Text size="lg" c="dimmed">
        No benchmark templates created yet.
      </Text>
      {onAddTemplate && (
        <Button
          color="green"
          leftSection={<IconPlus size={16} />}
          onClick={onAddTemplate}
        >
          Create Your First Template
        </Button>
      )}
    </Stack>
  );
}