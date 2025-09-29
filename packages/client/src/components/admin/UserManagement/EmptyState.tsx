import { Stack, Text, Button, Center } from '@mantine/core';
import { IconUsersGroup, IconUserPlus } from '@tabler/icons-react';

interface EmptyStateProps {
  hasFilters: boolean;
  onAddUser?: () => void;
  onClearFilters?: () => void;
}

export function EmptyState({ hasFilters, onAddUser, onClearFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md" style={{ maxWidth: 400 }}>
          <IconUsersGroup size={64} color="gray" />
          <Text size="lg" fw={500} c="dimmed">
            No users found
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            No users match your current search criteria. Try adjusting your filters or search terms.
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
        <IconUsersGroup size={64} color="gray" />
        <Text size="lg" fw={500} c="dimmed">
          No users yet
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Get started by creating your first user account. You can add team members and manage their permissions from here.
        </Text>
        {onAddUser && (
          <Button
            leftSection={<IconUserPlus size={16} />}
            color="green"
            onClick={onAddUser}
          >
            Add First User
          </Button>
        )}
      </Stack>
    </Center>
  );
}