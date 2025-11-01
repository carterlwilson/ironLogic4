import { Card, Stack, Text, Group, Button, Badge, Paper } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { ActivityProgress } from '../../pages/WorkoutPage';

interface CardioActivity {
  id: string;
  templateName: string;
  durationMinutes?: number;
  description?: string;
}

interface CardioActivityCardProps {
  activity: CardioActivity;
  progress: ActivityProgress;
  onActivityComplete: (activityId: string) => void;
}

export function CardioActivityCard({
  activity,
  progress,
  onActivityComplete,
}: CardioActivityCardProps) {
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
            {activity.description && (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {activity.description}
              </Text>
            )}
          </div>
          {progress.completed && (
            <Badge color="green" variant="filled" size="lg">
              Complete
            </Badge>
          )}
        </Group>

        {/* Duration */}
        {activity.durationMinutes && (
          <Paper p="md" radius="md" withBorder bg="white">
            <Group gap="xs" align="center">
              <IconClock size={20} style={{ opacity: 0.6 }} />
              <div>
                <Text size="sm" c="dimmed">
                  Duration
                </Text>
                <Text size="xl" fw={700} c="forestGreen">
                  {activity.durationMinutes} min
                </Text>
              </div>
            </Group>
          </Paper>
        )}

        {/* Mark Complete Button */}
        <Button
          variant={progress.completed ? 'outline' : 'filled'}
          color={progress.completed ? 'gray' : 'forestGreen'}
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