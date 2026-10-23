import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Stack, Group, Table, TextInput, Alert, Loader, Center, Paper, ScrollArea, Pagination, Select } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconClipboardCheck, IconSearch } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { useAttendanceRange } from '../hooks/useAttendanceRange';
import { useAttendanceSummary } from '../hooks/useAttendanceSummary';
import { AttendanceRangeControls } from '../components/attendance/AttendanceRangeControls';
import { formatPeriodLabel, formatAttendanceRate } from '../components/attendance/attendanceFormat';

const pageSizeOptions = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
];

export function AttendancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const range = useAttendanceRange();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { summary, loading, error } = useAttendanceSummary({
    from: range.from,
    to: range.to,
    groupBy: range.groupBy,
    search: debouncedSearch,
    page,
    limit: pageSize,
  });

  const clients = summary?.clients ?? [];
  const pagination = summary?.pagination;

  // Only owners and coaches can access
  if (user?.role !== 'owner' && user?.role !== 'coach') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        <Group gap="sm">
          <IconClipboardCheck size={32} />
          <div>
            <Title order={1}>Attendance</Title>
            <Text c="dimmed">Classes attended by each client</Text>
          </div>
        </Group>

        <Group justify="space-between" align="flex-end">
          <AttendanceRangeControls
            from={range.from}
            to={range.to}
            groupBy={range.groupBy}
            onFromChange={(value) => { range.setFrom(value); setPage(1); }}
            onToChange={(value) => { range.setTo(value); setPage(1); }}
            onGroupByChange={(value) => { range.setGroupBy(value); setPage(1); }}
          />
          <TextInput
            placeholder="Search clients..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
          />
        </Group>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {loading && !summary ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : summary && (
          <Paper withBorder radius="md">
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Client</Table.Th>
                    {summary.periods.map((period) => (
                      <Table.Th key={period} ta="center">
                        {formatPeriodLabel(period, summary.groupBy)}
                      </Table.Th>
                    ))}
                    <Table.Th ta="center">Total</Table.Th>
                    <Table.Th ta="center">Missed</Table.Th>
                    <Table.Th ta="center">Rate</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {clients.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={summary.periods.length + 4}>
                        <Text c="dimmed" ta="center" py="md">No clients found</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : clients.map((client) => (
                    <Table.Tr
                      key={client.clientId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/clients/${client.clientId}/attendance`)}
                    >
                      <Table.Td>
                        <Text fw={500}>{client.firstName} {client.lastName}</Text>
                      </Table.Td>
                      {client.byPeriod.map((period) => (
                        <Table.Td key={period.periodStart} ta="center">
                          <Text c={period.present === 0 ? 'dimmed' : undefined}>{period.present}</Text>
                        </Table.Td>
                      ))}
                      <Table.Td ta="center"><Text fw={600}>{client.present}</Text></Table.Td>
                      <Table.Td ta="center">{client.absent}</Table.Td>
                      <Table.Td ta="center">{formatAttendanceRate(client.present, client.absent)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        )}

        {pagination && pagination.totalPages > 1 && (
          <Stack gap="md" align="center">
            <Group justify="space-between" w="100%">
              <Text size="sm" c="dimmed">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clients
              </Text>

              <Select
                value={String(pageSize)}
                onChange={(value) => { setPageSize(Number(value)); setPage(1); }}
                data={pageSizeOptions}
                w={140}
              />
            </Group>

            <Pagination
              total={pagination.totalPages}
              value={pagination.page}
              onChange={setPage}
              size="sm"
            />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
