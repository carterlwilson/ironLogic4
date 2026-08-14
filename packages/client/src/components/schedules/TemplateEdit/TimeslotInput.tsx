import { Group, NumberInput, ActionIcon, Stack, TextInput, Card, Text, Divider } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconTrash, IconClock, IconMapPin } from '@tabler/icons-react';
import { isValidTimeFormat, isEndTimeAfterStartTime, formatTimeRange } from '../../../utils/scheduleUtils';
import { ClientAssignmentInput } from './ClientAssignmentInput';
import { CoachAssignmentInput } from './CoachAssignmentInput';
import type { Coach } from '../../../hooks/useCoaches';
import type { Client } from '../../../hooks/useClients';

export interface TimeslotData {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  coachIds: string[];
  location: string;
  assignedClients: string[];
}

interface TimeslotInputProps {
  timeslot: TimeslotData;
  onChange: (timeslot: TimeslotData) => void;
  onDelete: () => void;
  coaches: Coach[];
  clients: Client[];
  clientsLoading: boolean;
  disabled?: boolean;
}

/**
 * Single row for timeslot configuration
 * Includes start time, end time, capacity, and delete button
 */
export function TimeslotInput({
  timeslot,
  onChange,
  onDelete,
  coaches,
  clients,
  clientsLoading,
  disabled = false,
}: TimeslotInputProps) {
  const handleStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...timeslot, startTime: event.currentTarget.value });
  };

  const handleEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...timeslot, endTime: event.currentTarget.value });
  };

  const handleCapacityChange = (value: string | number) => {
    onChange({ ...timeslot, capacity: Number(value) });
  };

  const handleClientAssignmentChange = (clientIds: string[]) => {
    onChange({ ...timeslot, assignedClients: clientIds });
  };

  const handleCoachIdsChange = (coachIds: string[]) => {
    onChange({ ...timeslot, coachIds });
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...timeslot, location: event.currentTarget.value });
  };

  // Validation
  const startTimeError = timeslot.startTime && !isValidTimeFormat(timeslot.startTime)
    ? 'Invalid format (use HH:mm)'
    : null;

  const endTimeError = timeslot.endTime && !isValidTimeFormat(timeslot.endTime)
    ? 'Invalid format (use HH:mm)'
    : timeslot.startTime && timeslot.endTime && !isEndTimeAfterStartTime(timeslot.startTime, timeslot.endTime)
    ? 'End time must be after start time'
    : null;

  const capacityError = timeslot.capacity < 1 ? 'Capacity must be at least 1' : null;

  const coachError = timeslot.coachIds.length === 0 ? 'At least one coach is required' : null;

  const locationError = !timeslot.location.trim() ? 'Location is required' : null;

  return (
    <Card withBorder radius="md" padding="md" bg="var(--mantine-color-gray-0)">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconClock size={16} />
            <Text fw={600} size="sm">
              {formatTimeRange(timeslot.startTime, timeslot.endTime)}
            </Text>
          </Group>
          <ActionIcon
            color="red"
            variant="light"
            onClick={onDelete}
            disabled={disabled}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>

        <Group grow align="flex-start" wrap="nowrap">
          <TimeInput
            label="Start Time"
            value={timeslot.startTime}
            onChange={handleStartTimeChange}
            error={startTimeError}
            disabled={disabled}
            required
            leftSection={<IconClock size={16} />}
          />
          <TimeInput
            label="End Time"
            value={timeslot.endTime}
            onChange={handleEndTimeChange}
            error={endTimeError}
            disabled={disabled}
            required
            leftSection={<IconClock size={16} />}
          />
          <NumberInput
            label="Capacity"
            placeholder="10"
            min={1}
            value={timeslot.capacity}
            onChange={handleCapacityChange}
            error={capacityError}
            disabled={disabled}
            required
          />
          <TextInput
            label="Location"
            placeholder="e.g., Main Floor, Studio A"
            value={timeslot.location}
            onChange={handleLocationChange}
            error={locationError}
            disabled={disabled}
            required
            leftSection={<IconMapPin size={16} />}
          />
        </Group>

        <Divider />

        <CoachAssignmentInput
          coachIds={timeslot.coachIds}
          coaches={coaches}
          onChange={handleCoachIdsChange}
          disabled={disabled}
          error={coachError}
        />

        <Divider />

        <ClientAssignmentInput
          assignedClientIds={timeslot.assignedClients}
          capacity={timeslot.capacity}
          clients={clients}
          loading={clientsLoading}
          onChange={handleClientAssignmentChange}
          disabled={disabled}
        />
      </Stack>
    </Card>
  );
}