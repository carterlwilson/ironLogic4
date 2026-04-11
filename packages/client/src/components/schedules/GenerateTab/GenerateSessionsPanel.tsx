import { useState } from 'react';
import { Paper, Stack, Text, Button, Alert } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCalendarPlus } from '@tabler/icons-react';
import { scheduleApi } from '../../../services/scheduleApi';
import type { GenerateWeekResponse } from '@ironlogic4/shared';

function nextMondayString(): string {
  const today = new Date();
  const day = today.getDay();
  const daysUntil = day === 1 ? 7 : (8 - day) % 7 || 7;
  const d = new Date(today);
  d.setDate(today.getDate() + daysUntil);
  // Return YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function GenerateSessionsPanel() {
  const [targetDate, setTargetDate] = useState<string | null>(nextMondayString());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateWeekResponse | null>(null);

  const handleGenerate = async () => {
    if (!targetDate) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await scheduleApi.generateWeek(targetDate);
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

        <DatePickerInput
          label="Week Starting (Monday)"
          value={targetDate}
          onChange={setTargetDate}
          placeholder="Select Monday of target week"
          getDayProps={(date) => ({ disabled: new Date(date).getDay() !== 1 })}
          maw={320}
        />

        <div>
          <Button
            color="blue"
            loading={loading}
            disabled={!targetDate}
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
