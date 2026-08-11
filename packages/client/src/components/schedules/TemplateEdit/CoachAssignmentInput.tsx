import { Stack, MultiSelect, Group, Badge, Text } from '@mantine/core';
import { IconUserStar } from '@tabler/icons-react';
import type { Coach } from '../../../hooks/useCoaches';

interface CoachAssignmentInputProps {
  coachIds: string[];
  coaches: Coach[];
  onChange: (coachIds: string[]) => void;
  disabled?: boolean;
  error?: string | null;
}

/**
 * Component for assigning coaches to a timeslot
 */
export function CoachAssignmentInput({
  coachIds,
  coaches,
  onChange,
  disabled = false,
  error,
}: CoachAssignmentInputProps) {
  const coachOptions = coaches.map((coach) => ({
    value: coach.id,
    label: `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || coach.email,
  }));

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="sm" fw={500}>
          Coaches
        </Text>
        <Badge size="sm" color="blue" leftSection={<IconUserStar size={12} />}>
          {coachIds.length}
        </Badge>
      </Group>

      <MultiSelect
        placeholder="Select coaches..."
        data={coachOptions}
        value={coachIds}
        onChange={onChange}
        disabled={disabled}
        error={error}
        searchable
        clearable
        maxDropdownHeight={200}
      />
    </Stack>
  );
}
