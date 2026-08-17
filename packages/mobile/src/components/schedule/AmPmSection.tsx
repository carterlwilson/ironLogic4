import { Stack } from '@mantine/core';
import { FlatTimeslot } from '../../hooks/useSchedule';
import { TimeslotCard } from './TimeslotCard';

interface AmPmSectionProps {
  slots: FlatTimeslot[];
  mode: 'my' | 'available';
  actionLoading: Record<string, boolean>;
  onJoin: (slot: FlatTimeslot) => void;
  onLeave: (slot: FlatTimeslot) => void;
}

export function AmPmSection({ slots, mode, actionLoading, onJoin, onLeave }: AmPmSectionProps) {
  return (
    <Stack gap="xs">
      {slots.map((slot) => (
        <TimeslotCard
          key={slot.timeslotId}
          slot={slot}
          mode={mode}
          loading={actionLoading[slot.timeslotId] ?? false}
          onJoin={() => onJoin(slot)}
          onLeave={() => onLeave(slot)}
        />
      ))}
    </Stack>
  );
}
