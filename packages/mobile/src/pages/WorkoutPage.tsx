import { useState, useMemo } from 'react';
import { Container, Stack, Loader, Text, Paper, Button, Center } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useCurrentWeekWorkout } from '../hooks/useCurrentWeekWorkout';
import { useWorkoutProgress } from '../hooks/useWorkoutProgress';
import { WeekHeader } from '../components/workout/WeekHeader';
import { DaySelector } from '../components/workout/DaySelector';
import { ActivityList } from '../components/workout/ActivityList';
import { RestTimer } from '../components/workout/RestTimer';

export interface SetProgress {
  completed: boolean;
}

export interface ActivityProgress {
  sets: SetProgress[];
  completed: boolean;
}

export const WorkoutPage = () => {
  const { data, loading, error, refetch } = useCurrentWeekWorkout();
  const [selectedDay, setSelectedDay] = useState(0);
  const [restTimerStart, setRestTimerStart] = useState<number | null>(null);

  // Get activities for selected day
  const dayActivities = useMemo(() => {
    if (!data) return [];
    return data.currentWeek?.days[selectedDay]?.activities || [];
  }, [data, selectedDay]);

  const weekId = data?.currentWeek.id;
  const dayId = data?.currentWeek.days[selectedDay]?.id;

  const { getActivityProgress, handleSetComplete: persistSetComplete, handleActivityComplete } =
    useWorkoutProgress(weekId, dayId, dayActivities);

  const handleDayChange = (day: number) => {
    setSelectedDay(day);
    setRestTimerStart(null);
  };

  // Handle set completion — persists via hook and starts rest timer
  const handleSetComplete = (activityId: string, setIndex: number) => {
    const currentProgress = getActivityProgress(activityId);
    const wasCompleted = currentProgress.sets[setIndex]?.completed ?? false;
    persistSetComplete(activityId, setIndex);
    if (!wasCompleted) {
      setRestTimerStart(Date.now());
    }
  };

  if (loading) {
    return (
      <Container size="sm" pt="xl">
        <Center style={{ minHeight: '60vh' }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="sm" pt="xl">
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <Text size="lg" fw={600} c="red">
              Failed to Load Workout
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              {error}
            </Text>
            <Button leftSection={<IconRefresh size={18} />} onClick={refetch}>
              Retry
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container size="sm" pt="xl">
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md" align="center">
            <Text size="lg" fw={600}>
              No Program Assigned
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              You don't have a program assigned yet. Contact your trainer to get started.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" pt="md" pb={restTimerStart ? 100 : 'md'}>
      <Stack gap="md">
        <WeekHeader
          programName={data.program.name}
          blockName={data.currentBlock.name}
          weekNumber={data.currentWeek.order + 1}
        />

        {data.currentWeek.days.length > 0 && (
          <DaySelector
            days={data.currentWeek.days}
            selectedDay={selectedDay}
            onChange={handleDayChange}
          />
        )}

        {dayActivities.length === 0 ? (
          <Paper p="xl" radius="md" withBorder>
            <Text size="sm" c="dimmed" ta="center">
              No activities scheduled for today. Enjoy your rest day!
            </Text>
          </Paper>
        ) : (
          <ActivityList
            activities={dayActivities}
            getProgress={getActivityProgress}
            onSetComplete={handleSetComplete}
            onActivityComplete={handleActivityComplete}
            onDataRefresh={refetch}
          />
        )}
      </Stack>

      {restTimerStart && (
        <RestTimer
          startTime={restTimerStart}
          onReset={() => setRestTimerStart(null)}
        />
      )}
    </Container>
  );
};