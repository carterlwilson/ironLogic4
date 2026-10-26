import { useState } from 'react';
import { Paper, Stack, Group, Text, Badge, Box, ActionIcon, Select, UnstyledButton } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { ITimeSlot } from '@ironlogic4/shared';
import type { Coach } from '../../../hooks/useCoaches';
import type { Client } from '../../../hooks/useClients';
import { formatTime } from '../../../utils/scheduleUtils';

interface GridSlotProps {
  timeslot: ITimeSlot;
  coaches: Coach[];
  clients: Client[];
  clientsLoading: boolean;
  onAdd: (clientId: string) => Promise<void>;
  onRemove: (clientId: string) => Promise<void>;
}

const getCoachLabel = (coaches: Coach[], coachId: string) => {
  const coach = coaches.find((c) => c.id === coachId);
  if (!coach) return 'Unknown';
  return coach.firstName || coach.email;
};

const getFullClientName = (client: Client) =>
  `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() || client.email;

// Spreadsheet-style short name: "Katie O."
const getShortClientName = (client: Client) => {
  if (!client.firstName) return client.email;
  return client.lastName ? `${client.firstName} ${client.lastName[0]}.` : client.firstName;
};

/**
 * One class block in the schedule grid: time + coach header, then numbered
 * spots (filled with client names, open spots highlighted) like a sign-up sheet
 */
export function GridSlot({ timeslot, coaches, clients, clientsLoading, onAdd, onRemove }: GridSlotProps) {
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const assigned = timeslot.assignedClients;
  const openSpots = Math.max(0, timeslot.capacity - assigned.length);
  const rowCount = Math.max(timeslot.capacity, assigned.length);
  const columns = rowCount > 8 ? 2 : 1;
  const coachLabel = timeslot.coachIds.map((id) => getCoachLabel(coaches, id)).join(', ');

  const clientOptions = clients
    .filter((c) => !assigned.includes(c.id))
    .map((c) => ({ value: c.id, label: getFullClientName(c) }));

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    try {
      await action();
    } finally {
      setSaving(false);
    }
  };

  const renderSpot = (index: number) => {
    const clientId = assigned[index];

    if (clientId) {
      const client = clients.find((c) => c.id === clientId);
      return (
        <Group gap={4} wrap="nowrap" justify="space-between" px={4} style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" truncate title={client ? getFullClientName(client) : undefined}>
            {client ? getShortClientName(client) : clientsLoading ? '…' : 'Unknown client'}
          </Text>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            disabled={saving}
            aria-label="Remove client"
            onClick={() => void run(() => onRemove(clientId))}
          >
            <IconX size={12} />
          </ActionIcon>
        </Group>
      );
    }

    if (index >= timeslot.capacity) return null;

    if (addingIndex === index) {
      return (
        <Select
          size="xs"
          style={{ flex: 1 }}
          autoFocus
          searchable
          defaultDropdownOpened
          placeholder="Add client…"
          data={clientOptions}
          limit={50}
          nothingFoundMessage="No clients found"
          comboboxProps={{ withinPortal: true }}
          onChange={(value) => {
            setAddingIndex(null);
            if (value) void run(() => onAdd(value));
          }}
          onBlur={() => setAddingIndex(null)}
        />
      );
    }

    return (
      <UnstyledButton
        w="100%"
        h="100%"
        px={4}
        disabled={saving || clientsLoading}
        onClick={() => setAddingIndex(index)}
        style={{ backgroundColor: 'var(--mantine-color-green-light)' }}
        aria-label="Add client to open spot"
      >
        <Text size="xs" c="green">
          Open
        </Text>
      </UnstyledButton>
    );
  };

  return (
    <Paper withBorder radius="sm">
      <Stack gap={0}>
        <Stack gap={2} p={6} bg="var(--mantine-color-default-hover)" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <Text fw={700} size="sm" ta="center">
            {formatTime(timeslot.startTime)} ({coachLabel || 'No coach'})
          </Text>
          <Group gap={6} justify="center">
            {timeslot.location && (
              <Text size="xs" c="dimmed">
                {timeslot.location}
              </Text>
            )}
            <Badge size="xs" variant="light" color={openSpots === 0 ? 'red' : 'green'}>
              {openSpots === 0 ? 'Full' : `${openSpots} open`} · {assigned.length}/{timeslot.capacity}
            </Badge>
          </Group>
        </Stack>

        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${Math.ceil(rowCount / columns)}, 28px)`,
            gridAutoFlow: 'column',
          }}
        >
          {Array.from({ length: rowCount }, (_, index) => (
            <Group
              key={index}
              gap={0}
              wrap="nowrap"
              style={{
                borderTop: '1px solid var(--mantine-color-default-border)',
                borderLeft: columns > 1 && index >= Math.ceil(rowCount / columns)
                  ? '1px solid var(--mantine-color-default-border)'
                  : undefined,
                minWidth: 0,
              }}
            >
              <Text size="xs" c="dimmed" w={20} ta="right" pr={4} style={{ flexShrink: 0 }}>
                {index + 1}
              </Text>
              <Box style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
                {renderSpot(index)}
              </Box>
            </Group>
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}
