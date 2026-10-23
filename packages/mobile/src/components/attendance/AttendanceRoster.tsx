import { useState } from 'react';
import { Stack, Group, Text, Button, Paper, SegmentedControl, Badge, ActionIcon, Center, Loader, Alert } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconX } from '@tabler/icons-react';
import { AttendanceStatus, parseDateString } from '@ironlogic4/shared';
import { useClassAttendance } from '../../hooks/useClassAttendance';
import { AddClientModal } from '../schedule/AddClientModal';
import { FlatCoachTimeslot } from '../../utils/coachScheduleUtils';
import { formatTimeRange } from '../../utils/scheduleUtils';
import type { DirectoryClient } from '../../hooks/useClientDirectory';

interface AttendanceRosterProps {
  slot: FlatCoachTimeslot;
  date: string;
  clients: DirectoryClient[];
  clientMap: Map<string, DirectoryClient>;
  clientsLoading: boolean;
  onBack: () => void;
}

function clientName(client: { firstName?: string; lastName?: string } | undefined): string {
  return client?.firstName && client?.lastName ? `${client.firstName} ${client.lastName}` : 'Unknown client';
}

export function AttendanceRoster({ slot, date, clients, clientMap, clientsLoading, onBack }: AttendanceRosterProps) {
  const {
    statuses,
    walkInIds,
    alreadyRecorded,
    loading,
    submitting,
    error,
    presentCount,
    absentCount,
    setStatus,
    addWalkIn,
    removeWalkIn,
    submit,
  } = useClassAttendance(slot, date);
  const [walkInModalOpened, setWalkInModalOpened] = useState(false);

  const roster = [
    ...slot.assignedClients.map((client) => ({ id: client.id, name: clientName(client), walkIn: false })),
    ...walkInIds.map((id) => ({ id, name: clientName(clientMap.get(id)), walkIn: true })),
  ];

  const handleSubmit = async () => {
    if (await submit()) {
      onBack();
    }
  };

  return (
    <>
      <Stack gap="sm" mb={90}>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="gray" onClick={onBack}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Stack gap={0}>
            <Text fw={600}>{formatTimeRange(slot.startTime, slot.endTime)}</Text>
            <Text size="xs" c="dimmed">
              {parseDateString(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' · '}{slot.location}
            </Text>
          </Stack>
          {alreadyRecorded && (
            <Badge size="sm" variant="light" color="forestGreen" ml="auto">
              Recorded
            </Badge>
          )}
        </Group>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <>
            {roster.length === 0 && (
              <Text size="sm" c="dimmed" ta="center" py="md">
                No one is signed up for this class
              </Text>
            )}

            {roster.map((client) => (
              <Paper key={client.id} withBorder p="sm" radius="md">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm">{client.name}</Text>
                    {client.walkIn && (
                      <Badge size="xs" variant="light" color="gray">
                        Walk-in
                      </Badge>
                    )}
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <SegmentedControl
                      size="xs"
                      value={statuses[client.id] ?? AttendanceStatus.PRESENT}
                      onChange={(value) => setStatus(client.id, value as AttendanceStatus)}
                      color={statuses[client.id] === AttendanceStatus.ABSENT ? 'red' : 'forestGreen'}
                      data={[
                        { label: 'Present', value: AttendanceStatus.PRESENT },
                        { label: 'Absent', value: AttendanceStatus.ABSENT },
                      ]}
                    />
                    {client.walkIn && (
                      <ActionIcon size="sm" color="gray" variant="subtle" onClick={() => removeWalkIn(client.id)}>
                        <IconX size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
              </Paper>
            ))}

            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() => setWalkInModalOpened(true)}
            >
              Add Walk-in
            </Button>
          </>
        )}
      </Stack>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 70,
          padding: 12,
          borderTop: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-body)',
          zIndex: 100,
        }}
      >
        <Group justify="space-between">
          <Text size="sm" c="dimmed">{presentCount} present · {absentCount} absent</Text>
          <Button
            color="forestGreen"
            loading={submitting}
            disabled={loading || roster.length === 0}
            onClick={handleSubmit}
          >
            {alreadyRecorded ? 'Update Attendance' : 'Save Attendance'}
          </Button>
        </Group>
      </div>

      <AddClientModal
        opened={walkInModalOpened}
        onClose={() => setWalkInModalOpened(false)}
        onSelect={(clientId) => {
          addWalkIn(clientId);
          setWalkInModalOpened(false);
        }}
        clients={clients}
        loading={clientsLoading}
        alreadyAssignedIds={roster.map((c) => c.id)}
      />
    </>
  );
}
