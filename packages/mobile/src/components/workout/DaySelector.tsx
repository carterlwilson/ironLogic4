import { SegmentedControl, Box } from '@mantine/core';

interface Day {
  id: string;
  name: string;
  order: number;
}

interface DaySelectorProps {
  days: Day[];
  selectedDay: number;
  onChange: (day: number) => void;
}

export function DaySelector({ days, selectedDay, onChange }: DaySelectorProps) {
  const dayOptions = days.map((day, index) => ({
    value: String(index),
    label: day.name,
  }));

  return (
    <Box mb="md">
      <SegmentedControl
        value={String(selectedDay)}
        onChange={(value) => onChange(Number(value))}
        data={dayOptions}
        fullWidth
        size="md"
      />
    </Box>
  );
}