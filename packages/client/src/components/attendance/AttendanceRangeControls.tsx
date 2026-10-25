import { Group, TextInput, SegmentedControl } from '@mantine/core';
import type { AttendanceGroupBy } from '@ironlogic4/shared';

interface AttendanceRangeControlsProps {
  from: string;
  to: string;
  groupBy: AttendanceGroupBy;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onGroupByChange: (value: AttendanceGroupBy) => void;
}

export function AttendanceRangeControls({
  from,
  to,
  groupBy,
  onFromChange,
  onToChange,
  onGroupByChange,
}: AttendanceRangeControlsProps) {
  return (
    <Group align="flex-end">
      <TextInput
        type="date"
        label="From"
        value={from}
        max={to}
        onChange={(e) => onFromChange(e.currentTarget.value)}
      />
      <TextInput
        type="date"
        label="To"
        value={to}
        min={from}
        onChange={(e) => onToChange(e.currentTarget.value)}
        error={from > to ? 'Must be after From' : undefined}
      />
      <SegmentedControl
        value={groupBy}
        onChange={(value) => onGroupByChange(value as AttendanceGroupBy)}
        data={[
          { label: 'Weekly', value: 'week' },
          { label: 'Monthly', value: 'month' },
        ]}
      />
    </Group>
  );
}
