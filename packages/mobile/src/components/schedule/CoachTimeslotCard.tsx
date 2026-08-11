import { Paper, Group, Stack, Text, Badge, Button, ActionIcon } from '@mantine/core';
import { IconX, IconPlus } from '@tabler/icons-react';
import { FlatCoachTimeslot } from '../../utils/coachScheduleUtils';
import { formatTimeRange, formatCapacity, getCapacityColor } from '../../utils/scheduleUtils';

interface CoachTimeslotCardProps {
  slot: FlatCoachTimeslot;
  actionLoading: boolean;
  onAddClient: () => void;
  onRemoveClient: (clientId: string) => void;
}

export function CoachTimeslotCard({ slot, actionLoading, onAddClient, onRemoveClient }: CoachTimeslotCardProps) {
  const atCapacity = slot.assignedClients.length >= slot.capacity;

  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Stack gap={4}>
            <Text fw={600} size="sm">
              {formatTimeRange(slot.startTime, slot.endTime)}
            </Text>
            <Text size="xs" c="dimmed">
              {slot.location}
            </Text>
          </Stack>
          <Badge size="sm" color={getCapacityColor(slot.capacity - slot.assignedClients.length, slot.capacity)} variant="light">
            {formatCapacity(slot.capacity - slot.assignedClients.length, slot.capacity)}
          </Badge>
        </Group>

        {slot.assignedClients.length > 0 && (
          <Group gap="xs">
            {slot.assignedClients.map((client) => (
              <Badge
                key={client.id}
                size="lg"
                variant="light"
                rightSection={
                  <ActionIcon
                    size="xs"
                    color="gray"
                    variant="transparent"
                    onClick={() => onRemoveClient(client.id)}
                    disabled={actionLoading}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                }
              >
                {client.firstName && client.lastName ? `${client.firstName} ${client.lastName}` : 'Unknown client'}
              </Badge>
            ))}
          </Group>
        )}

        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={onAddClient}
          loading={actionLoading}
          disabled={atCapacity}
        >
          {atCapacity ? 'At capacity' : 'Add Client'}
        </Button>
      </Stack>
    </Paper>
  );
}
