import { Stack, Text, Button, Divider } from '@mantine/core';
import { ISessionWithRoster } from '../../services/scheduleApi';
import { AttendanceClientRow } from './AttendanceClientRow';

interface AttendanceRosterProps {
  session: ISessionWithRoster;
  attendance: Record<string, 'present' | 'absent' | 'late'>;
  attendanceLoading: boolean;
  onSetStatus: (clientId: string, status: 'present' | 'absent' | 'late') => void;
  onSubmit: (sessionId: string) => void;
}

export function AttendanceRoster({ session, attendance, attendanceLoading, onSetStatus, onSubmit }: AttendanceRosterProps) {
  return (
    <Stack gap="sm">
      <Divider />
      <Text fw={500} size="sm">Roster ({session.roster.length})</Text>
      {session.roster.length === 0 ? (
        <Text c="dimmed" size="sm">No enrolled clients</Text>
      ) : (
        session.roster.map(({ enrollmentId, client }) =>
          client ? (
            <AttendanceClientRow
              key={enrollmentId}
              client={client}
              status={attendance[client.id] ?? 'present'}
              onSetStatus={(status) => onSetStatus(client.id, status)}
            />
          ) : null
        )
      )}
      <Button
        fullWidth
        color="green"
        loading={attendanceLoading}
        onClick={() => onSubmit(session.id)}
      >
        Save Attendance
      </Button>
    </Stack>
  );
}
