import { useEffect, useState } from 'react';
import {
  Modal, Stack, Group, Text, Badge, Table, ActionIcon, Button,
  Select, Skeleton, Divider, Title, Alert,
} from '@mantine/core';
import { IconTrash, IconUserPlus, IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { Coach } from '../../../hooks/useCoaches';
import type { ISessionDetail } from '../../../services/scheduleApi';
import { clientApi } from '../../../services/clientApi';
import { formatTimeRange, getDayName } from '../../../utils/scheduleUtils';

interface SessionDetailModalProps {
  opened: boolean;
  loading: boolean;
  session: ISessionDetail | null;
  coaches: Coach[];
  onClose: () => void;
  onDelete: (sessionId: string) => Promise<void>;
  onEnroll: (sessionId: string, clientId: string) => Promise<void>;
  onUnenroll: (sessionId: string, clientId: string) => Promise<void>;
}

export function SessionDetailModal({
  opened,
  loading,
  session,
  coaches,
  onClose,
  onDelete,
  onEnroll,
  onUnenroll,
}: SessionDetailModalProps) {
  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setClientsLoading(true);
    clientApi.getClients({ limit: 200, page: 1 })
      .then(res => {
        const opts = (res.data || []).map(c => ({
          value: c.id,
          label: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email,
        }));
        setClientOptions(opts);
      })
      .catch(() => {})
      .finally(() => setClientsLoading(false));
  }, [opened]);

  const coachMap = new Map(coaches.map(c => [c.id, c]));

  const handleDeleteSession = async () => {
    if (!session) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setConfirmDelete(false);
    try {
      await onDelete(session.id);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to delete session',
        color: 'red',
      });
    }
  };

  const handleEnroll = async () => {
    if (!session || !selectedClientId) return;
    setActionLoading('enroll');
    try {
      await onEnroll(session.id, selectedClientId);
      setSelectedClientId(null);
      notifications.show({ title: 'Enrolled', message: 'Client added to session', color: 'green' });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to enroll client',
        color: 'red',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenroll = async (clientId: string) => {
    if (!session) return;
    setActionLoading(clientId);
    try {
      await onUnenroll(session.id, clientId);
      notifications.show({ title: 'Removed', message: 'Client removed from session', color: 'blue' });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to remove client',
        color: 'red',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const enrolledClientIds = new Set((session?.roster ?? []).map(r => r.clientId));
  const availableClients = clientOptions.filter(c => !enrolledClientIds.has(c.value));

  const coach = session ? coachMap.get(session.coachId) : null;
  const coachName = coach
    ? `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim() || coach.email
    : session?.coachId ?? '';

  const sessionDate = session ? new Date(session.date) : null;
  const dateLabel = sessionDate
    ? `${getDayName(sessionDate.getDay() as any)}, ${sessionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : '';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Session Details</Text>}
      size="lg"
    >
      {loading || !session ? (
        <Stack gap="sm">
          <Skeleton height={24} />
          <Skeleton height={24} />
          <Skeleton height={200} />
        </Stack>
      ) : (
        <Stack gap="md">
          {/* Session info */}
          <Group justify="space-between">
            <Stack gap={4}>
              <Title order={5}>{dateLabel}</Title>
              <Text size="sm" c="dimmed">
                {formatTimeRange(session.startTime, session.endTime)} · {coachName}
              </Text>
            </Stack>
            <Group gap="xs">
              <Badge variant="light" color={session.period === 'AM' ? 'blue' : 'violet'}>
                {session.period}
              </Badge>
              <Badge variant="light" color="gray">
                {session.enrolledCount} / {session.maxCapacity}
              </Badge>
            </Group>
          </Group>

          <Divider />

          {/* Roster */}
          <Text fw={600} size="sm">Roster</Text>
          {session.roster.length === 0 ? (
            <Text size="sm" c="dimmed">No clients enrolled</Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Client</Table.Th>
                  <Table.Th>Source</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {session.roster.map((entry) => (
                  <Table.Tr key={entry.enrollmentId}>
                    <Table.Td>
                      <Text size="sm">
                        {entry.client
                          ? `${entry.client.firstName} ${entry.client.lastName}`.trim()
                          : entry.clientId}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="xs" variant="outline" color={entry.source === 'default' ? 'blue' : 'gray'}>
                        {entry.source}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        loading={actionLoading === entry.clientId}
                        onClick={() => handleUnenroll(entry.clientId)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {/* Add client */}
          <Divider />
          <Text fw={600} size="sm">Add Client</Text>
          <Text size="xs" c="dimmed">Bypasses capacity limit (owner override)</Text>
          <Group>
            <Select
              placeholder="Search clients..."
              data={availableClients}
              value={selectedClientId}
              onChange={setSelectedClientId}
              disabled={clientsLoading}
              searchable
              flex={1}
            />
            <Button
              leftSection={<IconUserPlus size={16} />}
              disabled={!selectedClientId}
              loading={actionLoading === 'enroll'}
              onClick={handleEnroll}
            >
              Add
            </Button>
          </Group>

          {/* Delete session */}
          <Divider />
          {confirmDelete ? (
            <Alert color="red" icon={<IconAlertTriangle size={16} />} title="Confirm Delete">
              <Stack gap="xs">
                <Text size="sm">Delete this session and all its enrollments?</Text>
                <Group>
                  <Button size="xs" color="red" onClick={handleDeleteSession}>Yes, delete</Button>
                  <Button size="xs" variant="subtle" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                </Group>
              </Stack>
            </Alert>
          ) : (
            <Group justify="flex-end">
              <Button
                variant="light"
                color="red"
                leftSection={<IconAlertTriangle size={16} />}
                onClick={handleDeleteSession}
              >
                Delete Session
              </Button>
            </Group>
          )}
        </Stack>
      )}
    </Modal>
  );
}
