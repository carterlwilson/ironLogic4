import { useState, useEffect } from 'react';
import {
  Stack, Paper, Group, Text, Badge, Collapse, ActionIcon, Button,
  Modal, TextInput, ScrollArea, Center, Loader, Skeleton, UnstyledButton,
} from '@mantine/core';
import { IconTrash, IconPlus, IconSearch, IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import type { IScheduleTemplate, ITemplateClient } from '@ironlogic4/shared';
import type { ClientSummary } from '../../services/scheduleApi';
import { formatTimeRange } from '../../utils/scheduleUtils';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface CoachTemplateViewProps {
  templates: IScheduleTemplate[];
  clientsMap: Record<string, ITemplateClient[]>;
  allClients: ClientSummary[];
  expandedId: string | null;
  addModalTemplateId: string | null;
  loading: boolean;
  clientsLoading: boolean;
  allClientsLoading: boolean;
  removingClientId: string | null;
  addingClientId: string | null;
  toggleExpand: (templateId: string) => void;
  openAddModal: (templateId: string) => void;
  closeAddModal: () => void;
  addClient: (templateId: string, clientId: string) => void;
  removeClient: (templateId: string, clientId: string) => void;
  searchAllClients: (search: string) => void;
}

export function CoachTemplateView({
  templates,
  clientsMap,
  allClients,
  expandedId,
  addModalTemplateId,
  loading,
  clientsLoading,
  allClientsLoading,
  removingClientId,
  addingClientId,
  toggleExpand,
  openAddModal,
  closeAddModal,
  addClient,
  removeClient,
  searchAllClients,
}: CoachTemplateViewProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);

  useEffect(() => {
    if (addModalTemplateId) {
      searchAllClients(debouncedSearch);
    }
  }, [debouncedSearch, addModalTemplateId, searchAllClients]);

  const activeTemplate = addModalTemplateId
    ? templates.find(t => t.id === addModalTemplateId)
    : null;

  const assignedClientIds = addModalTemplateId
    ? new Set((clientsMap[addModalTemplateId] || []).map(c => c.clientId))
    : new Set<string>();

  if (loading) {
    return (
      <Stack gap="md">
        {[1, 2, 3].map(i => <Skeleton key={i} height={72} radius="md" />)}
      </Stack>
    );
  }

  if (templates.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">No template slots assigned to you.</Text>
      </Center>
    );
  }

  return (
    <>
      <Stack gap="sm">
        {templates.map(template => {
          const isExpanded = expandedId === template.id;
          const clients = clientsMap[template.id] || [];
          const assignedCount = template.assignedCount ?? clients.length;

          return (
            <Paper key={template.id} withBorder p="sm" radius="md">
              <UnstyledButton w="100%" onClick={() => toggleExpand(template.id)}>
                <Group justify="space-between" align="center">
                  <Group gap="xs" wrap="nowrap">
                    <Badge variant="light" color="blue" size="sm">
                      {DAY_NAMES[template.dayOfWeek as number]}
                    </Badge>
                    <Text size="sm" fw={500}>
                      {formatTimeRange(template.time, template.endTime)}
                    </Text>
                    <Badge variant="outline" color={template.period === 'AM' ? 'yellow' : 'violet'} size="xs">
                      {template.period}
                    </Badge>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" c={assignedCount >= template.maxCapacity ? 'red' : 'dimmed'}>
                      {assignedCount}/{template.maxCapacity}
                    </Text>
                    {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                  </Group>
                </Group>
              </UnstyledButton>

              <Collapse in={isExpanded}>
                <Stack gap="xs" mt="sm">
                  {clientsLoading && clients.length === 0 ? (
                    <Center py="sm"><Loader size="sm" /></Center>
                  ) : clients.length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" py="xs">No clients assigned</Text>
                  ) : (
                    clients.map(client => (
                      <Group key={client.clientId} justify="space-between" align="center">
                        <Text size="sm">{client.firstName} {client.lastName}</Text>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          loading={removingClientId === client.clientId}
                          onClick={() => removeClient(template.id, client.clientId)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    ))
                  )}
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    disabled={assignedCount >= template.maxCapacity}
                    onClick={() => openAddModal(template.id)}
                    mt="xs"
                  >
                    Add Client
                  </Button>
                </Stack>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>

      <Modal
        opened={!!addModalTemplateId}
        onClose={closeAddModal}
        title={activeTemplate
          ? `Add Client — ${DAY_NAMES[activeTemplate.dayOfWeek as number]} ${formatTimeRange(activeTemplate.time, activeTemplate.endTime)}`
          : 'Add Client'
        }
        size="md"
      >
        <Stack gap="sm">
          <TextInput
            placeholder="Search clients..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
          />
          <ScrollArea h={300}>
            {allClientsLoading ? (
              <Center py="xl"><Loader size="sm" /></Center>
            ) : allClients.length === 0 ? (
              <Center py="xl"><Text c="dimmed" size="sm">No clients found</Text></Center>
            ) : (
              <Stack gap={4}>
                {allClients.map(client => {
                  const isAssigned = assignedClientIds.has(client.id);
                  return (
                    <Group key={client.id} justify="space-between" align="center" px="xs" py={6}
                      style={{ borderRadius: 6, background: isAssigned ? 'var(--mantine-color-green-0)' : undefined }}
                    >
                      <div>
                        <Text size="sm">{client.firstName} {client.lastName}</Text>
                        <Text size="xs" c="dimmed">{client.email}</Text>
                      </div>
                      {isAssigned ? (
                        <ActionIcon variant="light" color="green" size="sm" disabled>
                          <IconCheck size={14} />
                        </ActionIcon>
                      ) : (
                        <Button
                          size="xs"
                          variant="light"
                          loading={addingClientId === client.id}
                          onClick={() => addModalTemplateId && addClient(addModalTemplateId, client.id)}
                        >
                          Add
                        </Button>
                      )}
                    </Group>
                  );
                })}
              </Stack>
            )}
          </ScrollArea>
          <Button variant="default" onClick={closeAddModal} fullWidth>Done</Button>
        </Stack>
      </Modal>
    </>
  );
}
