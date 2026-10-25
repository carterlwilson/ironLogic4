import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Title, Stack, Center, Loader, Alert, Text, Accordion } from '@mantine/core';
import { useAuth } from '../providers/AuthProvider';
import { useClientDirectory } from '../hooks/useClientDirectory';
import { useCoachActiveSchedule } from '../hooks/useCoachActiveSchedule';
import { AttendanceDayAccordion } from '../components/attendance/AttendanceDayAccordion';
import { AttendanceRoster } from '../components/attendance/AttendanceRoster';
import { getDateForDayOfWeek, type FlatCoachTimeslot } from '../utils/coachScheduleUtils';
import { groupSlotsByDay } from '../utils/scheduleUtils';

// Sunday(0) ... Saturday(6)
const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6];

export const AttendancePage = () => {
  const { user } = useAuth();
  const { clients, clientMap, loading: clientsLoading } = useClientDirectory();
  const { slots, loading, error } = useCoachActiveSchedule(clientMap);
  const [selectedSlot, setSelectedSlot] = useState<FlatCoachTimeslot | null>(null);
  const today = new Date().getDay();
  const [openDays, setOpenDays] = useState<string[]>([String(today)]);

  const grouped = useMemo(() => groupSlotsByDay(slots), [slots]);
  const orderedDays = DAY_ORDER.filter((day) => grouped.has(day));

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
            date={getDateForDayOfWeek(selectedSlot.dayOfWeek)}
            clients={clients}
            clientMap={clientMap}
            clientsLoading={clientsLoading}
            onBack={() => setSelectedSlot(null)}
          />
        ) : orderedDays.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            You don't coach any classes this week
          </Text>
        ) : (
          <Accordion multiple value={openDays} onChange={setOpenDays}>
            {orderedDays.map((dayOfWeek) => {
              const { am, pm } = grouped.get(dayOfWeek)!;
              return (
                <AttendanceDayAccordion
                  key={dayOfWeek}
                  dayOfWeek={dayOfWeek}
                  am={am}
                  pm={pm}
                  isToday={dayOfWeek === today}
                  locked={dayOfWeek > today}
                  onSelectClass={setSelectedSlot}
                />
              );
            })}
          </Accordion>
        )}
      </Stack>
    </Container>
  );
};
