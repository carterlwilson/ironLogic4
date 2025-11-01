import { Stack, Text, Button, Group } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { DaySection } from './DaySection';

interface TimeslotData {
  id: string;
  scheduleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSpots: number;
  isUserAssigned: boolean;
}

interface TimeslotViewProps {
  coachName: string;
  timeslotsByDay: Map<number, TimeslotData[]>;
  actionLoading: { [timeslotId: string]: boolean };
  onBack: () => void;
  onJoin: (scheduleId: string, timeslotId: string) => void;
  onLeave: (scheduleId: string, timeslotId: string) => void;
}

export function TimeslotView({
  coachName,
  timeslotsByDay,
  actionLoading,
  onBack,
  onJoin,
  onLeave,
}: TimeslotViewProps) {
  // Sort days by day of week (0-6)
  const sortedDays = Array.from(timeslotsByDay.entries()).sort(([a], [b]) => a - b);

  const hasTimeslots = sortedDays.length > 0;

  return (
    <Stack gap="lg">
      {/* Header with Back Button */}
      <Group justify="space-between" align="center">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={onBack}
        >
          Back
        </Button>
        <Text fw={700} size="lg">
          {coachName}
        </Text>
        <div style={{ width: 80 }} /> {/* Spacer for centering */}
      </Group>

      {/* Timeslots by Day */}
      {hasTimeslots ? (
        <Stack gap="md">
          {sortedDays.map(([dayOfWeek, timeslots]) => (
            <DaySection
              key={dayOfWeek}
              dayOfWeek={dayOfWeek}
              timeslots={timeslots}
              actionLoading={actionLoading}
              onJoin={onJoin}
              onLeave={onLeave}
            />
          ))}
        </Stack>
      ) : (
        <Stack align="center" py="xl">
          <Text c="dimmed" size="sm">
            No timeslots available for this coach.
          </Text>
        </Stack>
      )}
    </Stack>
  );
}