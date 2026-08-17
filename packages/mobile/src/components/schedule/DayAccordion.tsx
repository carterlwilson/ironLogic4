import { Accordion, Group, Text } from '@mantine/core';
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
        <Accordion multiple>
          {am.length > 0 && (
            <Accordion.Item value="am">
              <Accordion.Control>
                <Group gap="xs">
                  <Text fw={600}>AM</Text>
                  <Text size="sm" c="dimmed">
                    ({am.length})
                  </Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <AmPmSection
                  slots={am}
                  mode={mode}
                  actionLoading={actionLoading}
                  onJoin={onJoin}
                  onLeave={onLeave}
                />
              </Accordion.Panel>
            </Accordion.Item>
          )}
          {pm.length > 0 && (
            <Accordion.Item value="pm">
              <Accordion.Control>
                <Group gap="xs">
                  <Text fw={600}>PM</Text>
                  <Text size="sm" c="dimmed">
                    ({pm.length})
                  </Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <AmPmSection
                  slots={pm}
                  mode={mode}
                  actionLoading={actionLoading}
                  onJoin={onJoin}
                  onLeave={onLeave}
                />
              </Accordion.Panel>
            </Accordion.Item>
          )}
        </Accordion>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
