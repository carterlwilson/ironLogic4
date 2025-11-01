import { Card, Stack, Text, Group, Button, Badge, Paper } from '@mantine/core';
import { ActivityProgress } from '../../pages/WorkoutPage';

interface OtherActivity {
  id: string;
  templateName: string;
  description?: string;
}

interface OtherActivityCardProps {
  activity: OtherActivity;
  progress: ActivityProgress;
  onActivityComplete: (activityId: string) => void;
}

export function OtherActivityCard({
  activity,
  progress,
  onActivityComplete,
}: OtherActivityCardProps) {
  const getCardColor = () => {
    if (progress.completed) return 'green.0';
    return undefined;
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      bg={getCardColor()}
    >
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text fw={600} size="lg">
              {activity.templateName}
            </Text>
          </div>
          {progress.completed && (
            <Badge color="green" variant="filled" size="lg">
              Complete
            </Badge>
          )}
        </Group>

        {/* Description */}
        {activity.description && (
          <Paper p="md" radius="md" withBorder bg="white">
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {activity.description}
            </Text>
          </Paper>
        )}

        {/* Mark Complete Button */}
        <Button
          variant={progress.completed ? 'outline' : 'filled'}
          color={progress.completed ? 'gray' : 'blue'}
          size="md"
          onClick={() => onActivityComplete(activity.id)}
          fullWidth
        >
          {progress.completed ? 'Mark Incomplete' : 'Mark Complete'}
        </Button>
      </Stack>
    </Card>
  );
}