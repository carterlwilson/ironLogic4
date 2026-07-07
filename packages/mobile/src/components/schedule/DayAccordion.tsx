import { Accordion, Group, Stack, Text } from '@mantine/core';
import { FlatTimeslot } from '../../hooks/useSchedule';
import { getDayName } from '../../utils/scheduleUtils';
import { AmPmSection } from './AmPmSection';

interface DayAccordionProps {
  dayOfWeek: number;
  am: FlatTimeslot[];
  pm: FlatTimeslot[];
  mode: 'my' | 'available';
  actionLoading: Record<string, boolean>;
  onJoin: (slot: FlatTimeslot) => void;
  onLeave: (slot: FlatTimeslot) => void;
}

export function DayAccordion({ dayOfWeek, am, pm, mode, actionLoading, onJoin, onLeave }: DayAccordionProps) {
  const total = am.length + pm.length;

  return (
    <Accordion.Item value={String(dayOfWeek)}>
      <Accordion.Control>
        <Group gap="xs">
          <Text fw={600}>{getDayName(dayOfWeek)}</Text>
          <Text size="sm" c="dimmed">
            ({total})
          </Text>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="md">
          {am.length > 0 && (
            <AmPmSection
              label="AM"
              slots={am}
              mode={mode}
              actionLoading={actionLoading}
              onJoin={onJoin}
              onLeave={onLeave}
            />
          )}
          {pm.length > 0 && (
            <AmPmSection
              label="PM"
              slots={pm}
              mode={mode}
              actionLoading={actionLoading}
              onJoin={onJoin}
              onLeave={onLeave}
            />
          )}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
