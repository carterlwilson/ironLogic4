import { useState, useEffect, useCallback } from 'react';
import {
  Modal, Stack, Group, Text, Badge, TextInput, ScrollArea,
  ActionIcon, Divider, Tooltip, Loader, Center,
} from '@mantine/core';
import { IconSearch, IconTrash, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import type { IScheduleTemplate } from '@ironlogic4/shared';
import { scheduleApi, type ITemplateClient } from '../../../services/scheduleApi';
import { useClients } from '../../../hooks/useClients';
import { getDayName, formatTimeRange } from '../../../utils/scheduleUtils';

interface AssignClientsModalProps {
  template: IScheduleTemplate | null;
  opened: boolean;
  onClose: () => void;
  gymId: string;
}

export function AssignClientsModal({ template, opened, onClose, gymId }: AssignClientsModalProps) {
  const [assigned, setAssigned] = useState<ITemplateClient[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [search, setSearch] = useState('');
  const [busyClientId, setBusyClientId] = useState<string | null>(null);

  const { clients, loading: clientsLoading } = useClients(gymId);

  const loadAssigned = useCallback(async () => {
    if (!template) return;
    setLoadingAssigned(true);
    try {
      const res = await scheduleApi.getTemplateClients(template.id);
      setAssigned(res.data ?? []);
    } catch {
      // silently fail — user will see empty list
    } finally {
      setLoadingAssigned(false);
    }
  }, [template]);

  useEffect(() => {
    if (opened && template) {
      setSearch('');
      loadAssigned();
    }
  }, [opened, template, loadAssigned]);

  if (!template) return null;

  const assignedIds = new Set(assigned.map(a => a.clientId));
  const atCapacity = assigned.length >= template.maxCapacity;

  const unassigned = clients.filter(c => {
    if (assignedIds.has(c.id)) return false;
    if (!search.trim()) return true;
    const full = `${c.firstName ?? ''} ${c.lastName ?? ''} ${c.email}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  const handleRemove = async (client: ITemplateClient) => {
    setBusyClientId(client.clientId);
    try {
      await scheduleApi.removeClientFromTemplate(template.id, client.clientId);
      await loadAssigned();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to remove client',
        color: 'red',
      });
    } finally {
      setBusyClientId(null);
    }
  };

  const handleAdd = async (clientId: string) => {
    setBusyClientId(clientId);
    try {
      await scheduleApi.assignClientToTemplate(template.id, clientId);
      await loadAssigned();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to assign client',
        color: 'red',
      });
    } finally {
      setBusyClientId(null);
    }
  };

  const capacityColor = atCapacity ? 'red' : 'green';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={2}>
          <Text fw={600}>Assign Clients</Text>
          <Text size="xs" c="dimmed">
            {getDayName(template.dayOfWeek)} · {formatTimeRange(template.time, template.endTime)}
          </Text>
        </Stack>
      }
      size="md"
    >
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Default schedule enrollments</Text>
          <Badge color={capacityColor} variant="light">
            {assigned.length} / {template.maxCapacity} assigned
          </Badge>
        </Group>

        {/* Enrolled clients */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>Enrolled</Text>
          {loadingAssigned ? (
            <Center py="sm"><Loader size="sm" /></Center>
          ) : assigned.length === 0 ? (
            <Text size="sm" c="dimmed">No clients assigned yet.</Text>
          ) : (
            <ScrollArea.Autosize mah={180}>
              <Stack gap={4}>
                {assigned.map(client => (
                  <Group key={client.clientId} justify="space-between" px="xs" py={4}
                    style={{ borderRadius: 6, background: 'var(--mantine-color-default-hover)' }}>
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>{client.firstName} {client.lastName}</Text>
                      <Text size="xs" c="dimmed">{client.email}</Text>
                    </Stack>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      loading={busyClientId === client.clientId}
                      onClick={() => handleRemove(client)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          )}
        </Stack>

        <Divider />

        {/* Add clients */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>Add Clients</Text>
          <TextInput
            placeholder="Search clients..."
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            disabled={atCapacity}
          />
          {!search.trim() ? (
            <Text size="sm" c="dimmed">Search above to add clients.</Text>
          ) : clientsLoading ? (
            <Center py="sm"><Loader size="sm" /></Center>
          ) : unassigned.length === 0 ? (
            <Text size="sm" c="dimmed">
              {atCapacity ? 'Template is at capacity.' : 'No clients match your search.'}
            </Text>
          ) : (
            <ScrollArea.Autosize mah={200}>
              <Stack gap={4}>
                {unassigned.map(client => (
                  <Group key={client.id} justify="space-between" px="xs" py={4}
                    style={{ borderRadius: 6, background: 'var(--mantine-color-default-hover)' }}>
                    <Stack gap={0}>
                      <Text size="sm">{client.firstName} {client.lastName}</Text>
                      <Text size="xs" c="dimmed">{client.email}</Text>
                    </Stack>
                    <Tooltip label={atCapacity ? 'At capacity' : 'Assign client'} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="green"
                        size="sm"
                        disabled={atCapacity}
                        loading={busyClientId === client.id}
                        onClick={() => handleAdd(client.id)}
                      >
                        <IconUserPlus size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
}
