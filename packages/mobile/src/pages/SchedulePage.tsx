import { Container, Title, Text, Stack, ActionIcon, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useState } from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { CoachSelector } from '../components/schedule/CoachSelector';
import { TimeslotView } from '../components/schedule/TimeslotView';
import { ConfirmLeaveModal } from '../components/schedule/ConfirmLeaveModal';

interface LeaveModalState {
  opened: boolean;
  scheduleId: string | null;
  timeslotId: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  endTime: string | null;
}

export const SchedulePage = () => {
  const {
    coachesData,
    selectedCoach,
    selectedCoachId,
    timeslotsByDay,
    loading,
    actionLoading,
    loadSchedules,
    selectCoach,
    joinTimeslot,
    leaveTimeslot,
  } = useSchedule();

  const [leaveModalState, setLeaveModalState] = useState<LeaveModalState>({
    opened: false,
    scheduleId: null,
    timeslotId: null,
    dayOfWeek: null,
    startTime: null,
    endTime: null,
  });

  const handleJoinTimeslot = (scheduleId: string, timeslotId: string) => {
    joinTimeslot(scheduleId, timeslotId);
  };

  const handleLeaveClick = (scheduleId: string, timeslotId: string) => {
    // Find the timeslot details for the modal
    for (const [dayOfWeek, slots] of timeslotsByDay.entries()) {
      const slot = slots.find((s) => s.id === timeslotId);
      if (slot) {
        setLeaveModalState({
          opened: true,
          scheduleId,
          timeslotId,
          dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
        return;
      }
    }
  };

  const handleConfirmLeave = async () => {
    if (leaveModalState.scheduleId && leaveModalState.timeslotId) {
      await leaveTimeslot(leaveModalState.scheduleId, leaveModalState.timeslotId);
      setLeaveModalState({
        opened: false,
        scheduleId: null,
        timeslotId: null,
        dayOfWeek: null,
        startTime: null,
        endTime: null,
      });
    }
  };

  const handleCloseModal = () => {
    setLeaveModalState({
      opened: false,
      scheduleId: null,
      timeslotId: null,
      dayOfWeek: null,
      startTime: null,
      endTime: null,
    });
  };

  const handleBackToCoaches = () => {
    selectCoach(null);
  };

  return (
    <Container size="sm" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>Schedule</Title>
            <Text c="dimmed" size="sm">
              {selectedCoachId
                ? 'Select a timeslot to join'
                : 'Select a coach to view their schedule'}
            </Text>
          </div>
          <ActionIcon
            variant="light"
            size="lg"
            onClick={() => loadSchedules()}
            disabled={loading}
          >
            <IconRefresh size={20} />
          </ActionIcon>
        </Group>

        {/* Content */}
        {selectedCoachId && selectedCoach ? (
          <TimeslotView
            coachName={selectedCoach.name}
            timeslotsByDay={timeslotsByDay}
            actionLoading={actionLoading}
            onBack={handleBackToCoaches}
            onJoin={handleJoinTimeslot}
            onLeave={handleLeaveClick}
          />
        ) : (
          <CoachSelector
            coaches={coachesData}
            loading={loading}
            onSelectCoach={selectCoach}
          />
        )}
      </Stack>

      {/* Confirm Leave Modal */}
      <ConfirmLeaveModal
        opened={leaveModalState.opened}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLeave}
        timeslot={
          leaveModalState.dayOfWeek !== null &&
          leaveModalState.startTime &&
          leaveModalState.endTime
            ? {
                dayOfWeek: leaveModalState.dayOfWeek,
                startTime: leaveModalState.startTime,
                endTime: leaveModalState.endTime,
              }
            : null
        }
        loading={
          leaveModalState.timeslotId
            ? actionLoading[leaveModalState.timeslotId] || false
            : false
        }
      />
    </Container>
  );
};