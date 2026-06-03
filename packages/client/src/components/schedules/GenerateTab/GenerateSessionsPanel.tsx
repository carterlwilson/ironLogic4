import { useState } from 'react';
import { Paper, Stack, Text, Button, Alert, Group, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCalendarPlus, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { scheduleApi } from '../../../services/scheduleApi';
import type { GenerateWeekResponse } from '@ironlogic4/shared';

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function GenerateSessionsPanel() {
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const next = getMondayOfWeek(new Date());
    next.setDate(next.getDate() + 7);
    return next;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateWeekResponse | null>(null);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

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

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await scheduleApi.generateWeek(toLocalDateString(weekStart));
      const data = res.data ?? null;
      setResult(data);
      notifications.show({
        title: 'Success',
        message: `${data?.sessionsCreated ?? 0} sessions generated`,
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to generate sessions',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p="lg">
      <Stack gap="md">
        <Text fw={600} size="lg">
          Generate Class Sessions
        </Text>
        <Text c="dimmed" size="sm">
          Creates dated class sessions for the selected week based on your schedule templates.
          Clients with default schedules are automatically enrolled.
        </Text>

        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={prevWeek}>
            <IconChevronLeft size={16} />
          </ActionIcon>
          <Text fw={500} size="sm" style={{ minWidth: 200, textAlign: 'center' }}>
            {weekLabel}
          </Text>
          <ActionIcon variant="subtle" onClick={nextWeek}>
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>

        <div>
          <Button
            color="blue"
            loading={loading}
            onClick={handleGenerate}
            leftSection={<IconCalendarPlus size={16} />}
          >
            Generate Sessions
          </Button>
        </div>

        {result && (
          <Alert color="green" title="Sessions Generated">
            {result.sessionsCreated} sessions created, {result.enrollmentsCreated} auto-enrollments
            for week of {result.weekStart}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
