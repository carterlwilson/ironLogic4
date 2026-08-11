import { Stack, Text } from '@mantine/core';
import { FlatCoachTimeslot } from '../../utils/coachScheduleUtils';
import { CoachTimeslotCard } from './CoachTimeslotCard';

interface CoachAmPmSectionProps {
  label: 'AM' | 'PM';
  slots: FlatCoachTimeslot[];
  actionLoading: Record<string, boolean>;
  onAddClient: (slot: FlatCoachTimeslot) => void;
  onRemoveClient: (slot: FlatCoachTimeslot, clientId: string) => void;
}

export function CoachAmPmSection({ label, slots, actionLoading, onAddClient, onRemoveClient }: CoachAmPmSectionProps) {
  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed" fw={600} tt="uppercase">
        {label}
      </Text>
      <Stack gap="xs">
        {slots.map((slot) => (
          <CoachTimeslotCard
            key={slot.timeslotId}
            slot={slot}
            actionLoading={actionLoading[slot.timeslotId] ?? false}
            onAddClient={() => onAddClient(slot)}
            onRemoveClient={(clientId) => onRemoveClient(slot, clientId)}
          />
        ))}
      </Stack>
    </Stack>
  );
}
