import { useState } from 'react';
import { Paper, Stack, Group, Text, Badge, Divider, Card, ActionIcon, Button, TextInput } from '@mantine/core';
import { IconClock, IconMapPin, IconEdit, IconCheck, IconX } from '@tabler/icons-react';
import type { IActiveSchedule } from '@ironlogic4/shared';
import type { Coach } from '../../../hooks/useCoaches';
import { CoachAssignmentInput } from '../TemplateEdit/CoachAssignmentInput';
import { getDayName, formatTimeRange } from '../../../utils/scheduleUtils';

interface ActiveScheduleDisplayProps {
  schedule: IActiveSchedule;
  coaches: Coach[];
  onUpdateTimeslot: (timeslotId: string, data: { coachIds: string[]; location: string }) => Promise<void>;
}

/**
 * Display component for the active schedule
 * Shows all days, timeslots, and assigned coaches/location, with inline editing per timeslot
 */
export function ActiveScheduleDisplay({
  schedule,
  coaches,
  onUpdateTimeslot,
}: ActiveScheduleDisplayProps) {
  const [editingTimeslotId, setEditingTimeslotId] = useState<string | null>(null);
  const [draftCoachIds, setDraftCoachIds] = useState<string[]>([]);
  const [draftLocation, setDraftLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const getCoachName = (coachId: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return 'Unknown';
    return `${coach.firstName} ${coach.lastName}`.trim() || coach.email;
  };

  const startEditing = (timeslotId: string, coachIds: string[], location: string) => {
    setEditingTimeslotId(timeslotId);
    setDraftCoachIds(coachIds);
    setDraftLocation(location);
  };

  const cancelEditing = () => {
    setEditingTimeslotId(null);
  };

  const saveEditing = async () => {
    if (!editingTimeslotId) return;
    setSaving(true);
    try {
      await onUpdateTimeslot(editingTimeslotId, { coachIds: draftCoachIds, location: draftLocation });
      setEditingTimeslotId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Paper withBorder p="md">
        <Text size="sm" c="dimmed">
          Last reset: {new Date(schedule.lastResetAt).toLocaleDateString()}
        </Text>
      </Paper>

      {/* Days */}
      {schedule.days.map((day) => (
        <Paper key={day.dayOfWeek} withBorder p="md">
          <Stack gap="md">
            <Text fw={600} size="lg">
              {getDayName(day.dayOfWeek)}
            </Text>

            <Divider />

            <Stack gap="sm">
              {day.timeSlots.map((timeslot, index) => {
                const isEditing = editingTimeslotId === timeslot.id;

                return (
                  <Card key={timeslot.id || `${day.dayOfWeek}-${index}`} withBorder padding="sm">
                    <Group justify="space-between" align="flex-start">
                      <Group gap="md">
                        <Group gap="xs">
                          <IconClock size={16} />
                          <Text fw={500}>
                            {formatTimeRange(timeslot.startTime, timeslot.endTime)}
                          </Text>
                        </Group>
                        <Badge variant="light">
                          {timeslot.assignedClients.length} / {timeslot.capacity} spots
                        </Badge>
                      </Group>

                      {!isEditing && (
                        <ActionIcon
                          variant="subtle"
                          onClick={() => startEditing(timeslot.id, timeslot.coachIds, timeslot.location)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      )}
                    </Group>

                    {isEditing ? (
                      <Stack gap="sm" mt="sm">
                        <CoachAssignmentInput
                          coachIds={draftCoachIds}
                          coaches={coaches}
                          onChange={setDraftCoachIds}
                        />
                        <TextInput
                          label="Location"
                          placeholder="e.g., Main Floor, Studio A"
                          leftSection={<IconMapPin size={16} />}
                          value={draftLocation}
                          onChange={(e) => setDraftLocation(e.currentTarget.value)}
                        />
                        <Group justify="flex-end" gap="xs">
                          <Button variant="subtle" size="xs" leftSection={<IconX size={14} />} onClick={cancelEditing}>
                            Cancel
                          </Button>
                          <Button
                            size="xs"
                            leftSection={<IconCheck size={14} />}
                            loading={saving}
                            disabled={draftCoachIds.length === 0 || !draftLocation.trim()}
                            onClick={saveEditing}
                          >
                            Save
                          </Button>
                        </Group>
                      </Stack>
                    ) : (
                      <Group gap="xs" mt="xs">
                        {timeslot.coachIds.map((coachId) => (
                          <Badge key={coachId} size="sm" variant="light">
                            {getCoachName(coachId)}
                          </Badge>
                        ))}
                        <Badge size="sm" variant="outline" leftSection={<IconMapPin size={12} />}>
                          {timeslot.location}
                        </Badge>
                      </Group>
                    )}

                    {timeslot.assignedClients.length > 0 && (
                      <Group gap="xs" mt="xs">
                        <Text size="xs" c="dimmed">
                          Clients: {timeslot.assignedClients.length}
                        </Text>
                      </Group>
                    )}
                  </Card>
                );
              })}
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
