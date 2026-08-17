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

// Sunday(0) ... Saturday(6)
const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6];

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
