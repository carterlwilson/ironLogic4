import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Title, Stack, Center, Loader, Alert, Text } from '@mantine/core';
import { toDateString } from '@ironlogic4/shared';
import { useAuth } from '../providers/AuthProvider';
import { useClientDirectory } from '../hooks/useClientDirectory';
import { useCoachActiveSchedule } from '../hooks/useCoachActiveSchedule';
import { AttendanceClassCard } from '../components/attendance/AttendanceClassCard';
import { AttendanceRoster } from '../components/attendance/AttendanceRoster';
import type { FlatCoachTimeslot } from '../utils/coachScheduleUtils';

export const AttendancePage = () => {
  const { user } = useAuth();
  const { clients, clientMap, loading: clientsLoading } = useClientDirectory();
  const { slots, loading, error } = useCoachActiveSchedule(clientMap);
  const [selectedSlot, setSelectedSlot] = useState<FlatCoachTimeslot | null>(null);

  const todaysClasses = useMemo(() => {
    const dayOfWeek = new Date().getDay();
    return slots
      .filter((slot) => slot.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots]);

  if (user?.role !== 'coach') {
    return <Navigate to="/workout" replace />;
  }

  const showLoading = (loading || clientsLoading) && slots.length === 0;

  return (
    <Container size="sm" py="md">
      <Stack gap="lg">
        <Title order={1}>Attendance</Title>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {showLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : selectedSlot ? (
          <AttendanceRoster
            slot={selectedSlot}
            date={toDateString(new Date())}
            clients={clients}
            clientMap={clientMap}
            clientsLoading={clientsLoading}
            onBack={() => setSelectedSlot(null)}
          />
        ) : todaysClasses.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            You have no classes today
          </Text>
        ) : (
          <Stack gap="sm">
            {todaysClasses.map((slot) => (
              <AttendanceClassCard key={slot.timeslotId} slot={slot} onSelect={() => setSelectedSlot(slot)} />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
