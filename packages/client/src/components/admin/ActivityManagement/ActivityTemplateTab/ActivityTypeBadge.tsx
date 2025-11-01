import { Badge } from '@mantine/core';
import { ActivityType } from '@ironlogic4/shared/types/activityTemplates';

interface ActivityTypeBadgeProps {
  type: ActivityType;
}

const typeColors: Record<ActivityType, string> = {
  [ActivityType.LIFT]: 'blue',
  [ActivityType.CARDIO]: 'red',
  [ActivityType.BENCHMARK]: 'orange',
  [ActivityType.OTHER]: 'gray',
};

const typeLabels: Record<ActivityType, string> = {
  [ActivityType.LIFT]: 'Lift',
  [ActivityType.CARDIO]: 'Cardio',
  [ActivityType.BENCHMARK]: 'Benchmark',
  [ActivityType.OTHER]: 'Other',
};

export function ActivityTypeBadge({ type }: ActivityTypeBadgeProps) {
  return (
    <Badge color={typeColors[type]} variant="light">
      {typeLabels[type]}
    </Badge>
  );
}