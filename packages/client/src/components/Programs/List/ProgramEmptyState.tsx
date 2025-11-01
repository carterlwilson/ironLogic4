import { Paper, Stack, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

interface ProgramEmptyStateProps {
  onCreateProgram: () => void;
}

export function ProgramEmptyState({ onCreateProgram }: ProgramEmptyStateProps) {
  return (
    <Paper withBorder p="xl">
      <Stack align="center" gap="md" py="xl">
        <Text size="lg" fw={500} c="dimmed">
          No programs yet
        </Text>
        <Text size="sm" c="dimmed" ta="center" maw={400}>
          Get started by creating your first training program. You can add blocks, weeks, days, and activities to build a complete training plan.
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={onCreateProgram} mt="md">
          Create Your First Program
        </Button>
      </Stack>
    </Paper>
  );
}