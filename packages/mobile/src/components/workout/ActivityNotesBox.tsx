import { Paper, Text } from '@mantine/core';
import type { WorkoutActivity } from '@ironlogic4/shared/types/programs';

export function ActivityNotesBox({ activity }: { activity: WorkoutActivity }) {
  if (!activity.notes) return null;
  return (
    <Paper p="md" radius="md" withBorder bg="white">
      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
        {activity.notes}
      </Text>
    </Paper>
  );
}
