import { useState } from 'react';
import { Container, Stack, Title, SegmentedControl } from '@mantine/core';
import { useCoachSchedule } from '../../hooks/useCoachSchedule';
import { useCoachTemplates } from '../../hooks/useCoachTemplates';
import { CoachDayView } from './CoachDayView';
import { CoachTemplateView } from './CoachTemplateView';

export function CoachScheduleView() {
  const [activeTab, setActiveTab] = useState<'day' | 'template'>('day');

  const {
    selectedDate,
    daySessions,
    selectedSessionId,
    attendance,
    attendanceLoading,
    loading: dayLoading,
    navigateDay,
    selectSession,
    setAttendanceStatus,
    submitAttendance,
  } = useCoachSchedule();

  const templateState = useCoachTemplates();

  return (
    <Container size="sm" py="md">
      <Stack gap="lg">
        <Title order={1}>Schedule</Title>
        <SegmentedControl
          value={activeTab}
          onChange={(v) => setActiveTab(v as 'day' | 'template')}
          data={[
            { value: 'day', label: 'Day View' },
            { value: 'template', label: 'Template' },
          ]}
        />
        {activeTab === 'day' ? (
          <CoachDayView
            selectedDate={selectedDate}
            daySessions={daySessions}
            selectedSessionId={selectedSessionId}
            attendance={attendance}
            attendanceLoading={attendanceLoading}
            loading={dayLoading}
            navigateDay={navigateDay}
            selectSession={selectSession}
            setAttendanceStatus={setAttendanceStatus}
            submitAttendance={submitAttendance}
          />
        ) : (
          <CoachTemplateView
            templates={templateState.templates}
            clientsMap={templateState.clientsMap}
            allClients={templateState.allClients}
            expandedId={templateState.expandedId}
            addModalTemplateId={templateState.addModalTemplateId}
            loading={templateState.loading}
            clientsLoading={templateState.clientsLoading}
            allClientsLoading={templateState.allClientsLoading}
            removingClientId={templateState.removingClientId}
            addingClientId={templateState.addingClientId}
            toggleExpand={templateState.toggleExpand}
            openAddModal={templateState.openAddModal}
            closeAddModal={templateState.closeAddModal}
            addClient={templateState.addClient}
            removeClient={templateState.removeClient}
            searchAllClients={templateState.searchAllClients}
          />
        )}
      </Stack>
    </Container>
  );
}
