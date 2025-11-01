import { Paper, Text, Group, Stack } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';

interface WeekHeaderProps {
  programName: string;
  blockName: string;
  weekNumber: number;
}

export function WeekHeader({ programName, blockName, weekNumber }: WeekHeaderProps) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="xs">
        <Group gap="xs">
          <IconCalendar size={20} style={{ opacity: 0.6 }} />
          <Text size="sm" c="dimmed" fw={500}>
            Week {weekNumber}
          </Text>
        </Group>
        <Text size="lg" fw={700}>
          {programName}
        </Text>
        <Text size="sm" c="dimmed">
          {blockName}
        </Text>
      </Stack>
    </Paper>
  );
}