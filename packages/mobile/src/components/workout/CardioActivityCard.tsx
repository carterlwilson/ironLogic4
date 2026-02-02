import { Card, Stack, Text, Group, Button, Badge, Paper, Alert } from '@mantine/core';
import { IconClock, IconTarget, IconAlertCircle, IconRepeat } from '@tabler/icons-react';
import { ActivityProgress } from '../../pages/WorkoutPage';
import { CardioType } from '@ironlogic4/shared/types/programs';
import type { WorkoutActivity } from '@ironlogic4/shared/types/programs';
import { formatTimeSeconds } from '../../utils/benchmarkUtils';

interface CardioActivityCardProps {
  activity: WorkoutActivity;
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

  // Check if this is a benchmark-based cardio activity
  const isBenchmarkBased = activity.templateSubMaxId && activity.percentageOfMax;

  // Format distance for display
  const formatDistance = (meters: number | undefined | null): string => {
    if (!meters) return '';

    // For benchmark-based cardio, use cardioDistanceUnit from backend
    // For static prescriptions, use distanceUnit from activity
    const unitToUse = isBenchmarkBased ? activity.cardioDistanceUnit : activity.distanceUnit;

    // Convert to appropriate unit
    if (unitToUse === 'miles') {
      const miles = meters / 1609.34;
      return `${miles.toFixed(2)} miles`;
    } else if (unitToUse === 'kilometers') {
      const km = meters / 1000;
      return `${km.toFixed(2)} km`;
    } else if (unitToUse === 'yards') {
      const yards = meters * 1.09361;
      return `${yards.toFixed(0)} yards`;
    } else if (unitToUse === 'meters') {
      return `${meters.toFixed(0)} meters`;
    } else {
      // Fallback: display meters with explicit unit label
      return `${meters.toFixed(0)} m`;
    }
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

        {/* DISTANCE benchmark prescription */}
        {isBenchmarkBased && activity.calculatedDistanceMeters && (
          <>
            {activity.error ? (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title="Benchmark Not Found">
                <Text size="sm">{activity.error}</Text>
              </Alert>
            ) : (
              <Paper p="md" radius="md" withBorder bg="white">
                <Stack gap="xs">
                  <Group gap="xs" align="center">
                    <IconTarget size={20} style={{ opacity: 0.6 }} />
                    <Text size="sm" fw={600}>
                      Benchmark Prescription
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {activity.percentageOfMax}% of {activity.benchmarkName || 'benchmark'}
                  </Text>
                  <Text size="xl" fw={700} c="forestGreen">
                    {formatDistance(activity.calculatedDistanceMeters)}
                  </Text>
                </Stack>
              </Paper>
            )}
          </>
        )}

        {/* TIME benchmark prescription */}
        {isBenchmarkBased && activity.calculatedTimeSeconds && (
          <>
            {activity.error ? (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title="Benchmark Not Found">
                <Text size="sm">{activity.error}</Text>
              </Alert>
            ) : (
              <Paper p="md" radius="md" withBorder bg="white">
                <Stack gap="xs">
                  <Group gap="xs" align="center">
                    <IconClock size={20} style={{ opacity: 0.6 }} />
                    <Text size="sm" fw={600}>
                      Time Target
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {activity.percentageOfMax}% of {activity.benchmarkName || 'benchmark'}
                  </Text>
                  <Text size="xl" fw={700} c="forestGreen">
                    {formatTimeSeconds(activity.calculatedTimeSeconds)} for {activity.distanceInterval}
                  </Text>
                </Stack>
              </Paper>
            )}
          </>
        )}

        {/* Error display for benchmark-based activities without calculated values */}
        {isBenchmarkBased && !activity.calculatedDistanceMeters && !activity.calculatedTimeSeconds && activity.error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Benchmark Not Found">
            <Text size="sm">{activity.error}</Text>
          </Alert>
        )}

        {/* Static prescription - Duration */}
        {!isBenchmarkBased && (activity.cardioType === CardioType.TIME || (!activity.cardioType && activity.durationMinutes)) && activity.durationMinutes && (
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

        {/* Static prescription - Distance */}
        {!isBenchmarkBased && (activity.cardioType === CardioType.DISTANCE || (!activity.cardioType && activity.distance)) && activity.distance && activity.distanceUnit && (
          <Paper p="md" radius="md" withBorder bg="white">
            <Group gap="xs" align="center">
              <IconTarget size={20} style={{ opacity: 0.6 }} />
              <div>
                <Text size="sm" c="dimmed">
                  Distance
                </Text>
                <Text size="xl" fw={700} c="forestGreen">
                  {activity.distance} {activity.distanceUnit}
                </Text>
              </div>
            </Group>
          </Paper>
        )}

        {/* Static prescription - Repetitions */}
        {!isBenchmarkBased && activity.cardioType === CardioType.REPETITIONS && activity.repetitions && (
          <Paper p="md" radius="md" withBorder bg="white">
            <Group gap="xs" align="center">
              <IconRepeat size={20} style={{ opacity: 0.6 }} />
              <div>
                <Text size="sm" c="dimmed">
                  Repetitions
                </Text>
                <Text size="xl" fw={700} c="forestGreen">
                  {activity.repetitions} reps
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