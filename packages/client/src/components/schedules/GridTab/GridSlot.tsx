import { useState, type ReactElement } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  Box,
  ActionIcon,
  UnstyledButton,
  Combobox,
  ScrollArea,
  useCombobox,
} from '@mantine/core';
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
  /** Spots at the end of the class held back for weekly flex sign-ups; shown as "Flex", never "Open" */
  reservedSpots: number;
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

interface ClientPickerProps {
  options: { value: string; label: string }[];
  onPick: (clientId: string) => void;
  onClose: () => void;
  children: ReactElement;
}

/**
 * Searchable client list that drops down from a spot. The search box sits in the
 * dropdown so typed names aren't squeezed into the narrow grid cell, and the list
 * only closes on a pick, Escape or a click elsewhere — not on blur, which Safari
 * fires unexpectedly (e.g. from its autocorrect bubble)
 */
function ClientPicker({ options, onPick, onClose, children }: ClientPickerProps) {
  const [search, setSearch] = useState('');
  const combobox = useCombobox({ defaultOpened: true, onDropdownClose: onClose });

  const query = search.trim().toLowerCase();
  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query)) : options;

  return (
    <Combobox
      store={combobox}
      withinPortal
      position="bottom-start"
      // Size the dropdown to the longest name rather than the narrow grid column
      width="max-content"
      onOptionSubmit={(value) => {
        combobox.closeDropdown();
        onPick(value);
      }}
    >
      <Combobox.Target withAriaAttributes={false}>{children}</Combobox.Target>
      <Combobox.Dropdown miw={240}>
        <Combobox.Search
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search clients…"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <Combobox.Options>
          <ScrollArea.Autosize mah={300} type="scroll">
            {filtered.length === 0 ? (
              <Combobox.Empty>No clients found</Combobox.Empty>
            ) : (
              filtered.map((option) => (
                <Combobox.Option key={option.value} value={option.value} style={{ whiteSpace: 'nowrap' }}>
                  {option.label}
                </Combobox.Option>
              ))
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

/**
 * One class block in the schedule grid: time + coach header, then numbered
 * spots (filled with client names, open spots highlighted) like a sign-up sheet
 */
export function GridSlot({ timeslot, coaches, clients, clientsLoading, onAdd, onRemove, reservedSpots }: GridSlotProps) {
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  // The remove button only shows on hover so names get the full (narrow) column width
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const assigned = timeslot.assignedClients;
  const openSpots = Math.max(0, timeslot.capacity - reservedSpots - assigned.length);
  const rowCount = Math.max(timeslot.capacity, assigned.length);
  const columns = rowCount > 8 ? 2 : 1;
  const coachLabel = timeslot.coachIds.map((id) => getCoachLabel(coaches, id)).join(', ');

  const clientOptions = clients
    .filter((c) => !assigned.includes(c.id))
    .map((c) => ({ value: c.id, label: getFullClientName(c) }))
    .sort((a, b) => a.label.localeCompare(b.label));

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
        <Group gap={2} wrap="nowrap" justify="space-between" px={3} style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" truncate title={client ? getFullClientName(client) : undefined}>
            {client ? getShortClientName(client) : clientsLoading ? '…' : 'Unknown client'}
          </Text>
          {hoveredIndex === index && (
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
          )}
        </Group>
      );
    }

    if (index >= timeslot.capacity) return null;

    // Flex spots are reserved in the roster but can still be filled, like open spots
    const isFlex = index >= timeslot.capacity - reservedSpots;

    const spotButton = (
      <UnstyledButton
        w="100%"
        h="100%"
        px={3}
        disabled={saving || clientsLoading}
        onClick={() => setAddingIndex(index)}
        style={{
          backgroundColor: isFlex ? 'var(--mantine-color-default-hover)' : 'var(--mantine-color-green-light)',
          outline: addingIndex === index ? '2px solid var(--mantine-color-blue-filled)' : undefined,
          outlineOffset: -2,
        }}
        aria-label={isFlex ? 'Add client to flex spot' : 'Add client to open spot'}
      >
        {isFlex ? (
          <Text size="xs" c="dimmed" fs="italic">
            Flex
          </Text>
        ) : (
          <Text size="xs" c="green">
            Open
          </Text>
        )}
      </UnstyledButton>
    );

    if (addingIndex === index) {
      return (
        <ClientPicker
          options={clientOptions}
          onClose={() => setAddingIndex(null)}
          onPick={(value) => void run(() => onAdd(value))}
        >
          {spotButton}
        </ClientPicker>
      );
    }

    return spotButton;
  };

  return (
    <Paper withBorder radius="sm">
      <Stack gap={0}>
        <Stack gap={2} p={4} bg="var(--mantine-color-default-hover)" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <Text fw={700} size="xs" ta="center">
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
            gridTemplateRows: `repeat(${Math.ceil(rowCount / columns)}, 24px)`,
            gridAutoFlow: 'column',
          }}
        >
          {Array.from({ length: rowCount }, (_, index) => (
            <Group
              key={index}
              gap={0}
              wrap="nowrap"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                borderTop: '1px solid var(--mantine-color-default-border)',
                borderLeft: columns > 1 && index >= Math.ceil(rowCount / columns)
                  ? '1px solid var(--mantine-color-default-border)'
                  : undefined,
                minWidth: 0,
              }}
            >
              <Text size="xs" c="dimmed" w={16} ta="right" pr={3} style={{ flexShrink: 0 }}>
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
