import { Stack, Text, Button } from '@mantine/core';
import { IconUsers, IconUserPlus, IconSearch } from '@tabler/icons-react';

interface CoachEmptyStateProps {
  hasFilters: boolean;
  onAddCoach: () => void;
  onClearFilters: () => void;
}

export function CoachEmptyState({
  hasFilters,
  onAddCoach,
  onClearFilters,
}: CoachEmptyStateProps) {
  if (hasFilters) {
    // No results found with current filters
    return (
      <Stack align="center" gap="md" py="xl">
        <IconSearch size={48} color="gray" />
        <Text size="lg" fw={500} c="dimmed">
          No coaches found
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          No coaches match your search criteria.
          <br />
          Try adjusting your filters or search terms.
        </Text>
        <Button
          variant="light"
          onClick={onClearFilters}
        >
          Clear Filters
        </Button>
      </Stack>
    );
  }

  // No coaches at all
  return (
    <Stack align="center" gap="md" py="xl">
      <IconUsers size={48} color="gray" />
      <Text size="lg" fw={500} c="dimmed">
        No coaches yet
      </Text>
      <Text size="sm" c="dimmed" ta="center">
        Get started by adding your first coach.
        <br />
        Coaches can manage clients and programs.
      </Text>
      <Button
        color="green"
        leftSection={<IconUserPlus size={16} />}
        onClick={onAddCoach}
      >
        Add First Coach
      </Button>
    </Stack>
  );
}