import { useState, useMemo } from 'react';
import { Container, Stack, Loader, Text, Paper, Button, Center } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useCurrentWeekWorkout } from '../hooks/useCurrentWeekWorkout';
import { WeekHeader } from '../components/workout/WeekHeader';
import { DaySelector } from '../components/workout/DaySelector';
import { ActivityList } from '../components/workout/ActivityList';
import { RestTimer } from '../components/workout/RestTimer';
import { ActivityType } from '@ironlogic4/shared';

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
  const [activityProgress, setActivityProgress] = useState<Map<string, ActivityProgress>>(new Map());
  const [restTimerStart, setRestTimerStart] = useState<number | null>(null);

  // Get activities for selected day
  const dayActivities = useMemo(() => {
    if (!data) return [];
    return data.currentWeek?.days[selectedDay]?.activities || [];
  }, [data, selectedDay]);

  // Reset progress when day changes
  const handleDayChange = (day: number) => {
    setSelectedDay(day);
    setActivityProgress(new Map());
    setRestTimerStart(null);
  };

  // Handle set completion
  const handleSetComplete = (activityId: string, setIndex: number) => {
    setActivityProgress(prev => {
      const newMap = new Map(prev);
      const activity = dayActivities.find(a => a.id === activityId);
      const setsCount = activity?.setCalculations?.length || 0;

      const progress = newMap.get(activityId) || {
        sets: Array(setsCount).fill({ completed: false }),
        completed: false,
      };

      // Toggle set completion
      const newSets = [...progress.sets];
      newSets[setIndex] = { completed: !newSets[setIndex].completed };

      newMap.set(activityId, {
        ...progress,
        sets: newSets,
      });

      // Start rest timer
      if (newSets[setIndex].completed) {
        setRestTimerStart(Date.now());
      }

      return newMap;
    });
  };

  // Handle activity completion
  const handleActivityComplete = (activityId: string) => {
    setActivityProgress(prev => {
      const newMap = new Map(prev);
      const activity = dayActivities.find(a => a.id === activityId);

      if (!activity) return newMap;

      const setsCount = activity.type === ActivityType.LIFT
        ? (activity.setCalculations?.length || 0)
        : 0;

      const progress = newMap.get(activityId) || {
        sets: Array(setsCount).fill({ completed: false }),
        completed: false,
      };

      newMap.set(activityId, {
        ...progress,
        completed: !progress.completed,
      });

      return newMap;
    });
  };

  // Get progress for an activity
  const getActivityProgress = (activityId: string): ActivityProgress => {
    const activity = dayActivities.find(a => a.id === activityId);
    const setsCount = activity?.type === ActivityType.LIFT
      ? (activity.setCalculations?.length || 0)
      : 0;

    return activityProgress.get(activityId) || {
      sets: Array(setsCount).fill({ completed: false }),
      completed: false,
    };
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