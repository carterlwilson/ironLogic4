import { Paper, Stack, Group, Text, Badge, Divider, Card } from '@mantine/core';
import { IconUsers, IconClock } from '@tabler/icons-react';
import type { IActiveSchedule } from '@ironlogic4/shared';
import type { Coach } from '../../../hooks/useCoaches';
import { getDayName, formatTimeRange } from '../../../utils/scheduleUtils';

interface ActiveScheduleDisplayProps {
  schedule: IActiveSchedule;
  coaches: Coach[];
}

/**
 * Display component for the active schedule
 * Shows all days, timeslots, and assigned coaches
 */
export function ActiveScheduleDisplay({
  schedule,
  coaches,
}: ActiveScheduleDisplayProps) {
  const getCoachName = (coachId: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return 'Unknown';
    return `${coach.firstName} ${coach.lastName}`.trim() || coach.email;
  };

  return (
    <Stack gap="lg">
      {/* Schedule Info */}
      <Paper withBorder p="md">
        <Stack gap="xs">
          <Group gap="xs">
            <IconUsers size={20} />
            <Text fw={600}>Assigned Coaches ({schedule.coachIds.length})</Text>
          </Group>
          <Group gap="xs">
            {schedule.coachIds.map((coachId) => (
              <Badge key={coachId} size="lg" variant="light">
                {getCoachName(coachId)}
              </Badge>
            ))}
          </Group>
          <Text size="sm" c="dimmed">
            Last reset: {new Date(schedule.lastResetAt).toLocaleDateString()}
          </Text>
        </Stack>
      </Paper>

      {/* Days */}
      {schedule.days.map((day) => (
        <Paper key={day.dayOfWeek} withBorder p="md">
          <Stack gap="md">
            <Text fw={600} size="lg">
              {getDayName(day.dayOfWeek)}
            </Text>

            <Divider />

            <Stack gap="sm">
              {day.timeSlots.map((timeslot, index) => (
                <Card key={timeslot.id || `${day.dayOfWeek}-${index}`} withBorder padding="sm">
                  <Group justify="space-between">
                    <Group gap="md">
                      <Group gap="xs">
                        <IconClock size={16} />
                        <Text fw={500}>
                          {formatTimeRange(timeslot.startTime, timeslot.endTime)}
                        </Text>
                      </Group>
                      <Badge variant="light">
                        {timeslot.assignedClients.length} / {timeslot.capacity} spots
                      </Badge>
                    </Group>
                  </Group>

                  {timeslot.assignedClients.length > 0 && (
                    <Group gap="xs" mt="xs">
                      <Text size="xs" c="dimmed">
                        Clients: {timeslot.assignedClients.length}
                      </Text>
                    </Group>
                  )}
                </Card>
              ))}
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}