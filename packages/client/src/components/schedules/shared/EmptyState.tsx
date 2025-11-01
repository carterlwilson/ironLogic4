import { Paper, Stack, Text, Button } from '@mantine/core';
import { IconCalendarOff } from '@tabler/icons-react';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty state component for when there are no schedules
 */
export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Paper p="xl" withBorder>
      <Stack align="center" gap="md" py="xl">
        <IconCalendarOff size={48} color="#9ca3af" />
        <Stack align="center" gap="xs">
          <Text size="lg" fw={600}>
            {title}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {message}
          </Text>
        </Stack>
        {actionLabel && onAction && (
          <Button onClick={onAction} mt="sm">
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}