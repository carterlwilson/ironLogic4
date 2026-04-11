import { Container, Stack, Title, SegmentedControl } from '@mantine/core';
import { useCoachSchedule } from '../../hooks/useCoachSchedule';
import { CoachDayView } from './CoachDayView';
import { CoachWeekView } from './CoachWeekView';

export function CoachScheduleView() {
  const {
    view,
    selectedDate,
    daySessions,
    weekSessions,
    selectedSessionId,
    attendance,
    attendanceLoading,
    loading,
    setView,
    navigateDay,
    selectSession,
    setAttendanceStatus,
    submitAttendance,
    setDate,
    getMondayOfWeek,
  } = useCoachSchedule();

  return (
    <Container size="sm" py="md">
      <Stack gap="lg">
        <Title order={1}>Schedule</Title>
        <SegmentedControl
          value={view}
          onChange={(v) => setView(v as 'day' | 'week')}
          data={[
            { value: 'day', label: 'Day View' },
            { value: 'week', label: 'Week View' },
          ]}
        />
        {view === 'day' ? (
          <CoachDayView
            selectedDate={selectedDate}
            daySessions={daySessions}
            selectedSessionId={selectedSessionId}
            attendance={attendance}
            attendanceLoading={attendanceLoading}
            loading={loading}
            navigateDay={navigateDay}
            selectSession={selectSession}
            setAttendanceStatus={setAttendanceStatus}
            submitAttendance={submitAttendance}
          />
        ) : (
          <CoachWeekView
            selectedDate={selectedDate}
            weekSessions={weekSessions}
            loading={loading}
            getMondayOfWeek={getMondayOfWeek}
            setView={setView}
            setDate={setDate}
          />
        )}
      </Stack>
    </Container>
  );
}
