import { Accordion, Text } from '@mantine/core';
import { FlatCoachTimeslot } from '../../utils/coachScheduleUtils';
import { groupSlotsByDay } from '../../utils/scheduleUtils';
import { CoachDayAccordion } from './CoachDayAccordion';

interface CoachSlotListProps {
  slots: FlatCoachTimeslot[];
  actionLoading: Record<string, boolean>;
  onAddClient: (slot: FlatCoachTimeslot) => void;
  onRemoveClient: (slot: FlatCoachTimeslot, clientId: string) => void;
  emptyMessage: string;
}

// Monday(1) ... Saturday(6), Sunday(0) last
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function CoachSlotList({ slots, actionLoading, onAddClient, onRemoveClient, emptyMessage }: CoachSlotListProps) {
  const grouped = groupSlotsByDay(slots);

  if (grouped.size === 0) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        {emptyMessage}
      </Text>
    );
  }

  const orderedDays = DAY_ORDER.filter((day) => grouped.has(day));

  return (
    <Accordion multiple>
      {orderedDays.map((dayOfWeek) => {
        const { am, pm } = grouped.get(dayOfWeek)!;
        return (
          <CoachDayAccordion
            key={dayOfWeek}
            dayOfWeek={dayOfWeek}
            am={am}
            pm={pm}
            actionLoading={actionLoading}
            onAddClient={onAddClient}
            onRemoveClient={onRemoveClient}
          />
        );
      })}
    </Accordion>
  );
}
