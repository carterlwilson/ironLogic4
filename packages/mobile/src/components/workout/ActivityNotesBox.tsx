import { Paper, Group, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import type { WorkoutActivity } from '@ironlogic4/shared/types/programs';

export function ActivityNotesBox({ activity }: { activity: WorkoutActivity }) {
  if (!activity.notes) return null;
  return (
    <Paper p="md" radius="md" withBorder bg="white">
      <Group gap="xs" align="flex-start" wrap="nowrap">
        <IconAlertCircle size={18} color="var(--mantine-color-orange-6)" style={{ flexShrink: 0, marginTop: 2 }} />
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {activity.notes}
        </Text>
      </Group>
    </Paper>
  );
}
