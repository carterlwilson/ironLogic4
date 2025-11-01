import { Paper, Stack, Text, Button } from '@mantine/core';
import { IconUsers, IconFilterOff } from '@tabler/icons-react';

interface ClientEmptyStateProps {
  hasFilters: boolean;
  onAddClient?: () => void;
  onClearFilters?: () => void;
}

export function ClientEmptyState({ hasFilters, onAddClient, onClearFilters }: ClientEmptyStateProps) {
  if (hasFilters) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" gap="lg">
          <IconFilterOff size={64} color="gray" />
          <Stack align="center" gap="xs">
            <Text size="xl" fw={500}>
              No clients found
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              No clients match your current filters. Try clearing the filters to see all clients.
            </Text>
          </Stack>
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
      </Paper>
    );
  }

  return (
    <Paper p="xl" withBorder>
      <Stack align="center" gap="lg">
        <IconUsers size={64} color="gray" />
        <Stack align="center" gap="xs">
          <Text size="xl" fw={500}>
            No clients yet
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Get started by adding your first client to the system.
          </Text>
        </Stack>
        {onAddClient && (
          <Button
            color="green"
            leftSection={<IconUsers size={16} />}
            onClick={onAddClient}
          >
            Add First Client
          </Button>
        )}
      </Stack>
    </Paper>
  );
}