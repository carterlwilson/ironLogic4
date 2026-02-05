import { Badge } from '@mantine/core';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';

interface BenchmarkTypeBadgeProps {
  type: BenchmarkType;
}

const typeConfig: Record<BenchmarkType, { label: string; color: string }> = {
  [BenchmarkType.WEIGHT]: { label: 'Weight', color: 'blue' },
  [BenchmarkType.DISTANCE]: { label: 'Distance', color: 'cyan' },
  [BenchmarkType.TIME]: { label: 'Time', color: 'green' },
  [BenchmarkType.REPS]: { label: 'Reps', color: 'orange' },
  [BenchmarkType.OTHER]: { label: 'Other', color: 'gray' },
};

export function BenchmarkTypeBadge({ type }: BenchmarkTypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <Badge color={config.color} size="sm" variant="light">
      {config.label}
    </Badge>
  );
}