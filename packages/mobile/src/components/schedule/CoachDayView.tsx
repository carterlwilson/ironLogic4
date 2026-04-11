import { Stack, Group, Text, ActionIcon, Paper, Badge, Button, Skeleton, Center } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { ISessionWithRoster } from '../../services/scheduleApi';
import { AttendanceRoster } from './AttendanceRoster';
import { formatTimeRange } from '../../utils/scheduleUtils';

interface CoachDayViewProps {
  selectedDate: Date;
  daySessions: ISessionWithRoster[];
  selectedSessionId: string | null;
  attendance: Record<string, 'present' | 'absent' | 'late'>;
  attendanceLoading: boolean;
  loading: boolean;
  navigateDay: (direction: 'prev' | 'next') => void;
  selectSession: (session: ISessionWithRoster) => void;
  setAttendanceStatus: (clientId: string, status: 'present' | 'absent' | 'late') => void;
  submitAttendance: (sessionId: string) => void;
}

export function CoachDayView({
  selectedDate,
  daySessions,
  selectedSessionId,
  attendance,
  attendanceLoading,
  loading,
  navigateDay,
  selectSession,
  setAttendanceStatus,
  submitAttendance,
}: CoachDayViewProps) {
  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <ActionIcon variant="light" onClick={() => navigateDay('prev')}>
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text fw={500} size="lg">{dateLabel}</Text>
        <ActionIcon variant="light" onClick={() => navigateDay('next')}>
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>

      {loading ? (
        <Stack gap="sm">
          <Skeleton height={100} radius="md" />
          <Skeleton height={100} radius="md" />
        </Stack>
      ) : daySessions.length === 0 ? (
        <Center py="xl">
          <Text c="dimmed">No sessions today</Text>
        </Center>
      ) : (
        daySessions.map(session => (
          <Paper key={session.id} p="md" withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600}>{formatTimeRange(session.startTime, session.endTime)}</Text>
                <Badge color="blue" variant="light">{session.roster.length} enrolled</Badge>
              </Group>
              {selectedSessionId === session.id ? (
                <AttendanceRoster
                  session={session}
                  attendance={attendance}
                  attendanceLoading={attendanceLoading}
                  onSetStatus={setAttendanceStatus}
                  onSubmit={submitAttendance}
                />
              ) : (
                <Button size="sm" variant="light" onClick={() => selectSession(session)}>
                  View Roster
                </Button>
              )}
            </Stack>
          </Paper>
        ))
      )}
    </Stack>
  );
}
