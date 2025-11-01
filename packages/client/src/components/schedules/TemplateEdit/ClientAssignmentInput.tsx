import { Stack, MultiSelect, Group, Badge, Text } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useClients } from '../../../hooks/useClients';

interface ClientAssignmentInputProps {
  assignedClientIds: string[];
  capacity: number;
  gymId: string;
  onChange: (clientIds: string[]) => void;
  disabled?: boolean;
}

/**
 * Component for assigning clients to a timeslot
 * Shows client selection with capacity validation and visual feedback
 */
export function ClientAssignmentInput({
  assignedClientIds,
  capacity,
  gymId,
  onChange,
  disabled = false,
}: ClientAssignmentInputProps) {
  const { clients, loading } = useClients(gymId);

  // Create options for MultiSelect, filtering out already assigned clients from dropdown
  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: `${client.firstName} ${client.lastName}`.trim() || client.email,
  }));

  // Check if at capacity
  const isAtCapacity = assignedClientIds.length >= capacity;
  const utilizationPercentage = capacity > 0 ? (assignedClientIds.length / capacity) * 100 : 0;

  // Determine badge color based on utilization
  const getCapacityColor = () => {
    if (utilizationPercentage >= 100) return 'green';
    if (utilizationPercentage >= 80) return 'yellow';
    return 'blue';
  };

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="sm" fw={500}>
          Assigned Clients
        </Text>
        <Badge
          size="sm"
          color={getCapacityColor()}
          leftSection={<IconUsers size={12} />}
        >
          {assignedClientIds.length} / {capacity}
        </Badge>
      </Group>

      <MultiSelect
        placeholder={
          isAtCapacity
            ? 'At capacity'
            : assignedClientIds.length === 0
            ? 'Select clients...'
            : 'Add more clients...'
        }
        data={clientOptions}
        value={assignedClientIds}
        onChange={onChange}
        disabled={disabled || loading || isAtCapacity}
        searchable
        clearable
        maxDropdownHeight={200}
        limit={50}
        // Show helpful message when disabled due to capacity
        description={
          isAtCapacity
            ? 'Timeslot is at full capacity. Remove a client or increase capacity to add more.'
            : undefined
        }
        // Custom render for selected values
        renderOption={({ option }) => {
          const client = clients.find((c) => c.id === option.value);
          return (
            <div>
              <Text size="sm">
                {client ? `${client.firstName} ${client.lastName}`.trim() || client.email : option.label}
              </Text>
            </div>
          );
        }}
      />

      {/* Show warning if over capacity (shouldn't happen, but safeguard) */}
      {assignedClientIds.length > capacity && (
        <Text size="xs" c="red">
          Warning: {assignedClientIds.length - capacity} client(s) over capacity
        </Text>
      )}
    </Stack>
  );
}