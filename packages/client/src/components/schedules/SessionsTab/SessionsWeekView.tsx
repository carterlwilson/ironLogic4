import { useState, useEffect, useCallback } from 'react';
import {
  Stack, Group, ActionIcon, Text, Title, Paper, Table, Badge,
  Skeleton, Center, Button, Select, Accordion,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconCalendarEvent } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { IScheduleTemplate } from '@ironlogic4/shared';
import type { Coach } from '../../../hooks/useCoaches';
import type { IClassSessionWithCounts, ISessionDetail } from '../../../services/scheduleApi';
import { scheduleApi } from '../../../services/scheduleApi';
import { getDayName, formatTimeRange } from '../../../utils/scheduleUtils';
import { SessionDetailModal } from './SessionDetailModal';
import { DeleteWeekSessionsModal } from './DeleteWeekSessionsModal';

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface SessionsWeekViewProps {
  coaches: Coach[];
  templates: IScheduleTemplate[];
}

export function SessionsWeekView({ coaches, templates: _templates }: SessionsWeekViewProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [sessions, setSessions] = useState<IClassSessionWithCounts[]>([]);
  const [loading, setLoading] = useState(false);
  const [coachFilter, setCoachFilter] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ISessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteWeekOpen, setDeleteWeekOpen] = useState(false);
  const [deleteWeekLoading, setDeleteWeekLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await scheduleApi.getSessionsForWeek(toLocalDateString(weekStart));
      setSessions(res.data ?? []);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load sessions',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const filtered = sessions.filter(s => {
    if (coachFilter && s.coachId !== coachFilter) return false;
    if (periodFilter && s.period !== periodFilter) return false;
    return true;
  });

  const coachOptions = coaches.map(c => ({
    value: c.id,
    label: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email,
  }));

  const coachMap = new Map(coaches.map(c => [c.id, c]));

  const openDetail = async (session: IClassSessionWithCounts) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await scheduleApi.getSessionById(session.id);
      setSelectedSession(res.data ?? null);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load session',
        color: 'red',
      });
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await scheduleApi.deleteSession(sessionId);
    setDetailOpen(false);
    setSelectedSession(null);
    loadSessions();
  };

  const handleEnrollClient = async (sessionId: string, clientId: string) => {
    await scheduleApi.adminEnrollClient(sessionId, clientId);
    // Refresh detail
    const res = await scheduleApi.getSessionById(sessionId);
    setSelectedSession(res.data ?? null);
    loadSessions();
  };

  const handleUnenrollClient = async (sessionId: string, clientId: string) => {
    await scheduleApi.adminUnenrollClient(sessionId, clientId);
    const res = await scheduleApi.getSessionById(sessionId);
    setSelectedSession(res.data ?? null);
    loadSessions();
  };

  const handleDeleteWeek = async () => {
    setDeleteWeekLoading(true);
    try {
      const res = await scheduleApi.deleteSessionsForWeek(toLocalDateString(weekStart));
      const count = res.data?.deleted ?? sessions.length;
      notifications.show({
        title: 'Deleted',
        message: `Deleted ${count} ${count === 1 ? 'session' : 'sessions'} for this week`,
        color: 'blue',
      });
      await loadSessions();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to delete sessions',
        color: 'red',
      });
    } finally {
      setDeleteWeekLoading(false);
    }
  };

  return (
    <Stack gap="md">
      {/* Week navigation */}
      <Group justify="space-between" align="center">
        <Group>
          <ActionIcon variant="light" onClick={prevWeek}>
            <IconChevronLeft size={18} />
          </ActionIcon>
          <Title order={5}>{weekLabel}</Title>
          <ActionIcon variant="light" onClick={nextWeek}>
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
        <Group>
          <Select
            placeholder="All periods"
            data={[{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]}
            value={periodFilter}
            onChange={setPeriodFilter}
            clearable
            w={120}
          />
          <Select
            placeholder="All coaches"
            data={coachOptions}
            value={coachFilter}
            onChange={setCoachFilter}
            clearable
            searchable
            w={200}
          />
          <Button
            variant="light"
            color="red"
            disabled={sessions.length === 0 || loading}
            onClick={() => setDeleteWeekOpen(true)}
          >
            Delete This Week
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Stack gap="xs">
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </Stack>
      ) : filtered.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconCalendarEvent size={48} color="#9ca3af" />
            <Text c="dimmed">No sessions for this week</Text>
            <Text size="sm" c="dimmed">Use the Generate tab to create sessions from your templates.</Text>
          </Stack>
        </Center>
      ) : (() => {
        // Group sessions by day of week (derived from date), preserving Mon–Sun order
        const byDay = new Map<number, typeof filtered>();
        for (const s of filtered) {
          const dow = new Date(s.date).getDay();
          const list = byDay.get(dow) ?? [];
          list.push(s);
          byDay.set(dow, list);
        }
        // Order Mon(1)→Sun(0), keeping Sun at end
        const orderedDays = [1,2,3,4,5,6,0].filter(d => byDay.has(d));

        return (
          <Accordion variant="separated" multiple defaultValue={orderedDays.map(String)}>
            {orderedDays.map(dow => {
              const daySessions = byDay.get(dow)!;
              const date = new Date(daySessions[0].date);
              const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <Accordion.Item key={dow} value={String(dow)}>
                  <Accordion.Control>
                    <Group gap="sm">
                      <Text fw={600}>{getDayName(dow as any)}</Text>
                      <Text size="sm" c="dimmed">{dateLabel}</Text>
                      <Badge variant="light" color="gray" size="sm">
                        {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Paper>
                      <Table highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Period</Table.Th>
                            <Table.Th>Time</Table.Th>
                            <Table.Th>Coach</Table.Th>
                            <Table.Th>Enrolled</Table.Th>
                            <Table.Th></Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {daySessions.map(session => {
                            const coach = coachMap.get(session.coachId);
                            const coachName = coach
                              ? `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim() || coach.email
                              : session.coachId;
                            return (
                              <Table.Tr key={session.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(session)}>
                                <Table.Td>
                                  <Badge variant="light" color={session.period === 'AM' ? 'blue' : 'violet'} size="sm">
                                    {session.period}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm">{formatTimeRange(session.startTime, session.endTime)}</Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm">{coachName}</Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm" fw={500}>
                                    {session.enrolledCount} / {session.maxCapacity}
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Button size="xs" variant="light" onClick={(e) => { e.stopPropagation(); openDetail(session); }}>
                                    Details
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </Paper>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        );
      })()}

      <SessionDetailModal
        opened={detailOpen}
        loading={detailLoading}
        session={selectedSession}
        coaches={coaches}
        onClose={() => setDetailOpen(false)}
        onDelete={handleDeleteSession}
        onEnroll={handleEnrollClient}
        onUnenroll={handleUnenrollClient}
      />

      <DeleteWeekSessionsModal
        opened={deleteWeekOpen}
        onClose={() => setDeleteWeekOpen(false)}
        onConfirm={handleDeleteWeek}
        loading={deleteWeekLoading}
        weekLabel={weekLabel}
        sessionCount={sessions.length}
      />
    </Stack>
  );
}
