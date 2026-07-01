import { Accordion, Text } from '@mantine/core';
import { FlatTimeslot } from '../../hooks/useSchedule';
import { groupSlotsByDay } from '../../utils/scheduleUtils';
import { DayAccordion } from './DayAccordion';

interface SlotListProps {
  slots: FlatTimeslot[];
  mode: 'my' | 'available';
  actionLoading: Record<string, boolean>;
  onJoin: (slot: FlatTimeslot) => void;
  onLeave: (slot: FlatTimeslot) => void;
}

// Monday(1) ... Saturday(6), Sunday(0) last
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function SlotList({ slots, mode, actionLoading, onJoin, onLeave }: SlotListProps) {
  const grouped = groupSlotsByDay(slots);

  if (grouped.size === 0) {
    return (
      <Text ta="center" c="dimmed" py="xl">
        {mode === 'my' ? "You haven't joined any timeslots yet" : 'No available timeslots right now'}
      </Text>
    );
  }

  const orderedDays = DAY_ORDER.filter((day) => grouped.has(day));

  return (
    <Accordion multiple>
      {orderedDays.map((dayOfWeek) => {
        const { am, pm } = grouped.get(dayOfWeek)!;
        return (
          <DayAccordion
            key={dayOfWeek}
            dayOfWeek={dayOfWeek}
            am={am}
            pm={pm}
            mode={mode}
            actionLoading={actionLoading}
            onJoin={onJoin}
            onLeave={onLeave}
          />
        );
      })}
    </Accordion>
  );
}
