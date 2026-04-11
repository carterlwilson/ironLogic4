import { Container, Stack, Title, Group, ActionIcon, Text, SegmentedControl, Skeleton, Center } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useClientSchedule } from '../../hooks/useClientSchedule';
import { SessionCard } from './SessionCard';

export function ClientScheduleView() {
  const {
    filteredSessions,
    selectedDate,
    period,
    loading,
    actionLoading,
    enrolledSessionIds,
    setDate,
    setPeriod,
    enroll,
    unenroll,
  } = useClientSchedule();

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setDate(d);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setDate(d);
  };

  return (
    <Container size="sm" py="md">
      <Stack gap="md">
        {/* Date navigation */}
        <Group justify="space-between" align="center">
          <ActionIcon variant="light" onClick={prevDay}>
            <IconChevronLeft size={18} />
          </ActionIcon>
          <Stack gap={0} align="center">
            <Title order={3}>{dateLabel}</Title>
            {isToday && <Text c="dimmed" size="xs">Today</Text>}
          </Stack>
          <ActionIcon variant="light" onClick={nextDay}>
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>

        {/* Period filter */}
        <SegmentedControl
          fullWidth
          value={period ?? 'all'}
          onChange={(v) => setPeriod(v === 'all' ? null : v as 'AM' | 'PM')}
          data={[
            { value: 'all', label: 'All' },
            { value: 'AM', label: 'AM' },
            { value: 'PM', label: 'PM' },
          ]}
        />

        {/* Sessions list */}
        {loading ? (
          <Stack gap="sm">
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
          </Stack>
        ) : filteredSessions.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">No sessions on this day</Text>
          </Center>
        ) : (
          <Stack gap="sm">
            {filteredSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                isEnrolled={enrolledSessionIds.has(session.id)}
                onEnroll={enroll}
                onUnenroll={unenroll}
                actionLoading={actionLoading[session.id]}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
