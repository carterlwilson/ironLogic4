import { Stack } from '@mantine/core';
import { ActivityType } from '@ironlogic4/shared';
import { LiftActivityCard } from './LiftActivityCard';
import { CardioActivityCard } from './CardioActivityCard';
import { OtherActivityCard } from './OtherActivityCard';
import { ActivityProgress } from '../../pages/WorkoutPage';

interface Activity {
  id: string;
  type: ActivityType;
  templateName: string;
  sets?: number;
  reps?: number;
  percentageOfMax?: number;
  // New server fields for benchmark data
  calculatedWeightKg?: number;
  benchmarkWeightKg?: number;
  benchmarkName?: string;
  benchmarkTemplateId?: string;
  durationMinutes?: number;
  description?: string;
}

interface ActivityListProps {
  activities: Activity[];
  getProgress: (activityId: string) => ActivityProgress;
  onSetComplete: (activityId: string, setIndex: number) => void;
  onActivityComplete: (activityId: string) => void;
}

export function ActivityList({
  activities,
  getProgress,
  onSetComplete,
  onActivityComplete,
}: ActivityListProps) {
  return (
    <Stack gap="md">
      {activities.map((activity) => {
        const progress = getProgress(activity.id);

        if (activity.type === ActivityType.LIFT) {
          return (
            <LiftActivityCard
              key={activity.id}
              activity={activity}
              progress={progress}
              onSetComplete={onSetComplete}
              onActivityComplete={onActivityComplete}
            />
          );
        }

        if (activity.type === ActivityType.CARDIO) {
          return (
            <CardioActivityCard
              key={activity.id}
              activity={activity}
              progress={progress}
              onActivityComplete={onActivityComplete}
            />
          );
        }

        return (
          <OtherActivityCard
            key={activity.id}
            activity={activity}
            progress={progress}
            onActivityComplete={onActivityComplete}
          />
        );
      })}
    </Stack>
  );
}