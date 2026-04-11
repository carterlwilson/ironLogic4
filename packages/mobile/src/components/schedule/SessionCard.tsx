import { Paper, Group, Stack, Text, Badge, Button } from '@mantine/core';
import { IClassSessionWithAvailability } from '../../services/scheduleApi';
import { formatTimeRange, getCapacityColor } from '../../utils/scheduleUtils';

interface SessionCardProps {
  session: IClassSessionWithAvailability;
  isEnrolled: boolean;
  onEnroll: (sessionId: string) => void;
  onUnenroll: (sessionId: string) => void;
  actionLoading?: boolean;
}

export function SessionCard({ session, isEnrolled, onEnroll, onUnenroll, actionLoading }: SessionCardProps) {
  const coachName = session.coach
    ? `${session.coach.firstName} ${session.coach.lastName}`.trim()
    : 'Coach';

  return (
    <Paper
      p="md"
      withBorder
      style={isEnrolled ? { borderLeft: '3px solid var(--mantine-color-green-6)' } : undefined}
    >
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text fw={500}>{formatTimeRange(session.startTime, session.endTime)}</Text>
          <Text c="dimmed" size="sm">{coachName}</Text>
        </Stack>
        <Stack gap={4} align="flex-end">
          <Badge
            color={getCapacityColor(session.availableSpots, session.maxCapacity)}
            variant="light"
          >
            {session.availableSpots} spot{session.availableSpots !== 1 ? 's' : ''} left
          </Badge>
          {isEnrolled ? (
            <Button
              size="xs"
              color="red"
              variant="light"
              loading={actionLoading}
              onClick={() => onUnenroll(session.id)}
            >
              Leave
            </Button>
          ) : session.availableSpots <= 0 ? (
            <Button size="xs" variant="light" disabled>Full</Button>
          ) : (
            <Button
              size="xs"
              color="green"
              loading={actionLoading}
              onClick={() => onEnroll(session.id)}
            >
              Join
            </Button>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
