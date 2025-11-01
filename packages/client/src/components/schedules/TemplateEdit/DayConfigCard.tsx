import { Card, Stack, Text, Button, Divider, Collapse, Badge, ActionIcon, Group } from '@mantine/core';
import { IconPlus, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { DayOfWeek } from '@ironlogic4/shared';
import { TimeslotInput, type TimeslotData } from './TimeslotInput';
import { generateTimeslotId, getDayName } from '../../../utils/scheduleUtils';

export interface DayConfigData {
  dayOfWeek: DayOfWeek;
  timeSlots: TimeslotData[];
}

interface DayConfigCardProps {
  day: DayConfigData;
  gymId: string;
  onChange: (day: DayConfigData) => void;
}

/**
 * Card component for configuring a single day
 * Displays day of week as read-only and manages timeslots
 */
export function DayConfigCard({ day, gymId, onChange }: DayConfigCardProps) {
  const [opened, { toggle, open }] = useDisclosure(false);
  const timeslotCount = day.timeSlots.length;

  const handleAddTimeslot = () => {
    const newTimeslot: TimeslotData = {
      id: generateTimeslotId(),
      startTime: '09:00',
      endTime: '10:00',
      capacity: 10,
      assignedClients: [],
    };
    onChange({ ...day, timeSlots: [...day.timeSlots, newTimeslot] });
    open();
  };

  const handleTimeslotChange = (index: number, timeslot: TimeslotData) => {
    const newTimeSlots = [...day.timeSlots];
    newTimeSlots[index] = timeslot;
    onChange({ ...day, timeSlots: newTimeSlots });
  };

  const handleDeleteTimeslot = (index: number) => {
    const newTimeSlots = day.timeSlots.filter((_, i) => i !== index);
    onChange({ ...day, timeSlots: newTimeSlots });
  };

  return (
    <Card withBorder shadow="sm" padding="md">
      <Stack gap="md">
        {/* Collapsible header */}
        <Group
          justify="space-between"
          onClick={toggle}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          wrap="nowrap"
        >
          <Group gap="sm">
            <Text fw={600} size="lg">
              {getDayName(day.dayOfWeek)}
            </Text>
            <Badge size="sm" variant="light" color={timeslotCount > 0 ? 'blue' : 'gray'}>
              {timeslotCount} {timeslotCount === 1 ? 'timeslot' : 'timeslots'}
            </Badge>
          </Group>

          <ActionIcon variant="subtle" size="lg">
            {opened ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </ActionIcon>
        </Group>

        {/* Collapsible content */}
        <Collapse in={opened}>
          <Stack gap="md">
            <Divider label="Time Slots" labelPosition="center" />

            {/* Timeslots list */}
            {day.timeSlots.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center">
                No timeslots added yet. Click "Add Timeslot" to get started.
              </Text>
            ) : (
              <Stack gap="sm">
                {day.timeSlots.map((timeslot, index) => (
                  <TimeslotInput
                    key={timeslot.id}
                    timeslot={timeslot}
                    gymId={gymId}
                    onChange={(ts) => handleTimeslotChange(index, ts)}
                    onDelete={() => handleDeleteTimeslot(index)}
                  />
                ))}
              </Stack>
            )}

            {/* Add timeslot button */}
            <Button
              variant="subtle"
              leftSection={<IconPlus size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                handleAddTimeslot();
              }}
              size="sm"
            >
              Add Timeslot
            </Button>
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}