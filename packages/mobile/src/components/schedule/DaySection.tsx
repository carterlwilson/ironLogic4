import { useState } from 'react';
import { Stack, Text, Paper, Group, ActionIcon, Badge, Collapse } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { TimeslotCard } from './TimeslotCard';
import { getDayName } from '../../utils/scheduleUtils';

interface TimeslotData {
  id: string;
  scheduleId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSpots: number;
  isUserAssigned: boolean;
}

interface DaySectionProps {
  dayOfWeek: number;
  timeslots: TimeslotData[];
  actionLoading: { [timeslotId: string]: boolean };
  onJoin: (scheduleId: string, timeslotId: string) => void;
  onLeave: (scheduleId: string, timeslotId: string) => void;
}

export function DaySection({
  dayOfWeek,
  timeslots,
  actionLoading,
  onJoin,
  onLeave,
}: DaySectionProps) {
  const [isOpen, setIsOpen] = useState(false); // Collapsed by default

  if (timeslots.length === 0) {
    return null;
  }

  // Calculate user joined status and timeslot count
  const hasUserJoined = timeslots.some(slot => slot.isUserAssigned);
  const timeslotCount = timeslots.length;

  return (
    <Stack gap={0}>
      {/* Clickable Header */}
      <Paper
        withBorder
        p="md"
        style={{ cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Group justify="space-between" wrap="nowrap">
          {/* Left side: Chevron, Day name, and count */}
          <Group gap="sm" wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
            >
              {isOpen ? (
                <IconChevronDown size={16} />
              ) : (
                <IconChevronRight size={16} />
              )}
            </ActionIcon>
            <Text fw={600} size="md">
              {getDayName(dayOfWeek)}
            </Text>
            <Text c="dimmed" size="sm">
              ({timeslotCount})
            </Text>
          </Group>

          {/* Right side: Joined badge (conditional) */}
          {hasUserJoined && (
            <Badge color="green" variant="light" size="sm">
              Joined
            </Badge>
          )}
        </Group>
      </Paper>

      {/* Collapsible Timeslots */}
      <Collapse in={isOpen}>
        <Stack gap="sm" pt="sm">
          {timeslots.map((timeslot, index) => (
            <TimeslotCard
              key={timeslot.id || `${dayOfWeek}-${timeslot.scheduleId}-${index}`}
              id={timeslot.id}
              scheduleId={timeslot.scheduleId}
              startTime={timeslot.startTime}
              endTime={timeslot.endTime}
              capacity={timeslot.capacity}
              availableSpots={timeslot.availableSpots}
              isUserAssigned={timeslot.isUserAssigned}
              loading={actionLoading[timeslot.id] || false}
              onJoin={onJoin}
              onLeave={onLeave}
            />
          ))}
        </Stack>
      </Collapse>
    </Stack>
  );
}
