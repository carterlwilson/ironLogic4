import { Stack, Text, SimpleGrid, Paper, Badge, Skeleton } from '@mantine/core';
import type { IClassSession } from '@ironlogic4/shared';
import { getShortDayName, formatTime } from '../../utils/scheduleUtils';

interface CoachWeekViewProps {
  selectedDate: Date;
  weekSessions: (IClassSession & { enrolledCount: number })[];
  loading: boolean;
  getMondayOfWeek: (date: Date) => Date;
  setView: (view: 'day' | 'week') => void;
  setDate: (date: Date) => void;
}

export function CoachWeekView({ selectedDate, weekSessions, loading, getMondayOfWeek, setView, setDate }: CoachWeekViewProps) {
  const monday = getMondayOfWeek(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });

  const weekStart = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Group sessions by date string YYYY-MM-DD
  const sessionsByDate = weekSessions.reduce<Record<string, typeof weekSessions>>((acc, s) => {
    const key = new Date(s.date).toISOString().split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <Stack gap="md">
      <Text fw={500}>Week of {weekStart}</Text>
      {loading ? (
        <Skeleton height={120} radius="md" />
      ) : (
        <SimpleGrid cols={7} spacing="xs">
          {weekDates.map(date => {
            const key = date.toISOString().split('T')[0];
            const daySessions = sessionsByDate[key] || [];
            return (
              <Paper
                key={key}
                p="xs"
                withBorder
                style={{ cursor: 'pointer', minHeight: 80 }}
                onClick={() => { setDate(date); setView('day'); }}
              >
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed">{getShortDayName(date.getUTCDay())}</Text>
                  <Text size="sm" fw={500}>{date.getUTCDate()}</Text>
                  {daySessions.map(s => (
                    <Stack key={s.id} gap={1} align="center">
                      <Text size="xs">{formatTime(s.startTime)}</Text>
                      <Badge size="xs" color="blue">{s.enrolledCount}</Badge>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
}
