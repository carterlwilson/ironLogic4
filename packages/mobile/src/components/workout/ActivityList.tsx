import { Stack } from '@mantine/core';
import { ActivityType } from '@ironlogic4/shared';
import { LiftActivityCard } from './LiftActivityCard';
import { CardioActivityCard } from './CardioActivityCard';
import { OtherActivityCard } from './OtherActivityCard';
import { ActivityProgress } from '../../pages/WorkoutPage';

import type { WorkoutActivity } from '@ironlogic4/shared/types/programs';

interface ActivityListProps {
  activities: WorkoutActivity[];
  getProgress: (activityId: string) => ActivityProgress;
  onSetComplete: (activityId: string, setIndex: number) => void;
  onActivityComplete: (activityId: string) => void;
  onDataRefresh?: () => void;
}

export function ActivityList({
  activities,
  getProgress,
  onSetComplete,
  onActivityComplete,
  // onDataRefresh, // Commented out - not used since AddBenchmarkModal is disabled
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
              // onDataRefresh={onDataRefresh} // Commented out - not used since AddBenchmarkModal is disabled
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