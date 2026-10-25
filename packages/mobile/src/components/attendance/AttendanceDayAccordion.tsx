import { Accordion, Badge, Group, Stack, Text } from '@mantine/core';
import { parseDateString } from '@ironlogic4/shared';
import { FlatCoachTimeslot, getDateForDayOfWeek } from '../../utils/coachScheduleUtils';
import { getDayName } from '../../utils/scheduleUtils';
import { AttendanceClassCard } from './AttendanceClassCard';

interface AttendanceDayAccordionProps {
  dayOfWeek: number;
  am: FlatCoachTimeslot[];
  pm: FlatCoachTimeslot[];
  isToday: boolean;
  locked: boolean;
  onSelectClass: (slot: FlatCoachTimeslot) => void;
}

export function AttendanceDayAccordion({ dayOfWeek, am, pm, isToday, locked, onSelectClass }: AttendanceDayAccordionProps) {
  const total = am.length + pm.length;
  const dateLabel = parseDateString(getDateForDayOfWeek(dayOfWeek))
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const sections: { label: 'AM' | 'PM'; slots: FlatCoachTimeslot[] }[] = [
    { label: 'AM', slots: am },
    { label: 'PM', slots: pm },
  ];

  return (
    <Accordion.Item value={String(dayOfWeek)}>
      <Accordion.Control>
        <Group gap="xs">
          <Text fw={600}>{getDayName(dayOfWeek)}</Text>
          <Text size="sm" c="dimmed">
            {dateLabel} ({total})
          </Text>
          {isToday && (
            <Badge size="xs" variant="light" color="forestGreen">
              Today
            </Badge>
          )}
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="md">
          {sections.filter((section) => section.slots.length > 0).map((section) => (
            <Stack key={section.label} gap="xs">
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                {section.label}
              </Text>
              <Stack gap="xs">
                {section.slots.map((slot) => (
                  <AttendanceClassCard
                    key={slot.timeslotId}
                    slot={slot}
                    locked={locked}
                    onSelect={() => onSelectClass(slot)}
                  />
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
