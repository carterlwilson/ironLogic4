import { Stack, Text, Button, Center } from '@mantine/core';
import { IconBuildingStore, IconPlus } from '@tabler/icons-react';

interface GymEmptyStateProps {
  hasFilters: boolean;
  onAddGym?: () => void;
  onClearFilters?: () => void;
}

export function GymEmptyState({ hasFilters, onAddGym, onClearFilters }: GymEmptyStateProps) {
  if (hasFilters) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md" style={{ maxWidth: 400 }}>
          <IconBuildingStore size={64} color="gray" />
          <Text size="lg" fw={500} c="dimmed">
            No gyms found
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            No gyms match your current search criteria. Try adjusting your filters or search terms.
          </Text>
          {onClearFilters && (
            <Button variant="subtle" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )}
        </Stack>
      </Center>
    );
  }

  return (
    <Center py="xl">
      <Stack align="center" gap="md" style={{ maxWidth: 400 }}>
        <IconBuildingStore size={64} color="gray" />
        <Text size="lg" fw={500} c="dimmed">
          No gyms yet
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Get started by adding your first gym location. You can manage multiple gym locations and their owners from here.
        </Text>
        {onAddGym && (
          <Button
            leftSection={<IconPlus size={16} />}
            color="green"
            onClick={onAddGym}
          >
            Add First Gym
          </Button>
        )}
      </Stack>
    </Center>
  );
}