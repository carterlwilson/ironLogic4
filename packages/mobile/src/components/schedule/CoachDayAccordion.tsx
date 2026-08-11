import { Accordion, Group, Stack, Text } from '@mantine/core';
import { FlatCoachTimeslot } from '../../utils/coachScheduleUtils';
import { getDayName } from '../../utils/scheduleUtils';
import { CoachAmPmSection } from './CoachAmPmSection';

interface CoachDayAccordionProps {
  dayOfWeek: number;
  am: FlatCoachTimeslot[];
  pm: FlatCoachTimeslot[];
  actionLoading: Record<string, boolean>;
  onAddClient: (slot: FlatCoachTimeslot) => void;
  onRemoveClient: (slot: FlatCoachTimeslot, clientId: string) => void;
}

export function CoachDayAccordion({ dayOfWeek, am, pm, actionLoading, onAddClient, onRemoveClient }: CoachDayAccordionProps) {
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
            <CoachAmPmSection
              label="AM"
              slots={am}
              actionLoading={actionLoading}
              onAddClient={onAddClient}
              onRemoveClient={onRemoveClient}
            />
          )}
          {pm.length > 0 && (
            <CoachAmPmSection
              label="PM"
              slots={pm}
              actionLoading={actionLoading}
              onAddClient={onAddClient}
              onRemoveClient={onRemoveClient}
            />
          )}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
