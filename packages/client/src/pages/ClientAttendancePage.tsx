import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Stack, Group, Button, Table, Alert, Loader, Center, Paper, Badge, SimpleGrid } from '@mantine/core';
import { IconArrowLeft, IconClipboardCheck } from '@tabler/icons-react';
import { AttendanceStatus, parseDateString } from '@ironlogic4/shared';
import { useAuth } from '../providers/AuthProvider';
import { useAttendanceRange } from '../hooks/useAttendanceRange';
import { useClientAttendance } from '../hooks/useClientAttendance';
import { AttendanceRangeControls } from '../components/attendance/AttendanceRangeControls';
import { formatPeriodLabel, formatAttendanceRate } from '../components/attendance/attendanceFormat';

export function ClientAttendancePage() {
  const { user } = useAuth();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const range = useAttendanceRange();
  const { history, loading, error } = useClientAttendance(clientId, range);

  // Only owners and coaches can access
  if (user?.role !== 'owner' && user?.role !== 'coach') {
    return <Navigate to="/dashboard" replace />;
  }

  const summary = history?.summary;

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Group gap="sm">
            <IconClipboardCheck size={32} />
            <div>
              <Title order={1}>
                {summary ? `${summary.firstName} ${summary.lastName}` : 'Client'} Attendance
              </Title>
              <Text c="dimmed">Classes attended over the selected range</Text>
            </div>
          </Group>
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/attendance')}>
            All Attendance
          </Button>
        </Group>

        <AttendanceRangeControls
          from={range.from}
          to={range.to}
          groupBy={range.groupBy}
          onFromChange={range.setFrom}
          onToChange={range.setTo}
          onGroupByChange={range.setGroupBy}
        />

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {loading && !history ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : history && summary && (
          <>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Paper withBorder p="md" radius="md">
                <Text size="sm" c="dimmed">Classes attended</Text>
                <Text size="xl" fw={700}>{summary.present}</Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text size="sm" c="dimmed">Classes missed</Text>
                <Text size="xl" fw={700}>{summary.absent}</Text>
              </Paper>
              <Paper withBorder p="md" radius="md">
                <Text size="sm" c="dimmed">Attendance rate</Text>
                <Text size="xl" fw={700}>{formatAttendanceRate(summary.present, summary.absent)}</Text>
              </Paper>
            </SimpleGrid>

            <Paper withBorder radius="md">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{history.groupBy === 'month' ? 'Month' : 'Week of'}</Table.Th>
                    <Table.Th ta="center">Attended</Table.Th>
                    <Table.Th ta="center">Missed</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {summary.byPeriod.map((period) => (
                    <Table.Tr key={period.periodStart}>
                      <Table.Td>{formatPeriodLabel(period.periodStart, history.groupBy)}</Table.Td>
                      <Table.Td ta="center">{period.present}</Table.Td>
                      <Table.Td ta="center">{period.absent}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>

            <Title order={3}>Classes</Title>
            <Paper withBorder radius="md">
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Time</Table.Th>
                    <Table.Th>Location</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {history.records.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <Text c="dimmed" ta="center" py="md">No attendance recorded in this range</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : history.records.map((record) => (
                    <Table.Tr key={record.id}>
                      <Table.Td>
                        {parseDateString(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Table.Td>
                      <Table.Td>{record.startTime}–{record.endTime}</Table.Td>
                      <Table.Td>{record.location}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Badge
                            variant="light"
                            color={record.status === AttendanceStatus.PRESENT ? 'forestGreen' : 'red'}
                          >
                            {record.status === AttendanceStatus.PRESENT ? 'Present' : 'Absent'}
                          </Badge>
                          {record.walkIn && (
                            <Badge variant="light" color="gray">Walk-in</Badge>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </>
        )}
      </Stack>
    </Container>
  );
}
