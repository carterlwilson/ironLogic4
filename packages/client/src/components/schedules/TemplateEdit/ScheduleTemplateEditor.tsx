import { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Group,
  Text,
  TextInput,
  Textarea,
  Button,
  Loader,
  Paper,
  Divider,
} from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { IconCheck, IconAlertCircle, IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import type { IScheduleTemplate, UpdateScheduleTemplateRequest } from '@ironlogic4/shared';
import { scheduleApi } from '../../../services/scheduleApi';
import type { Coach } from '../../../hooks/useCoaches';
import { DayConfigCard, type DayConfigData } from './DayConfigCard';

type SaveStatus = 'saved' | 'pending' | 'saving' | 'blocked' | 'error';

interface FormSnapshot {
  name: string;
  description: string;
  days: DayConfigData[];
}

interface ScheduleTemplateEditorProps {
  template: IScheduleTemplate;
  gymId: string;
  coaches: Coach[];
  onDeleteRequest: () => void;
}

function renderSaveStatus(
  status: SaveStatus,
  error: string | null,
  blockedReason: string,
  onRetry: () => void
) {
  switch (status) {
    case 'pending':
      return (
        <Group gap={6}>
          <Loader size="xs" />
          <Text size="sm" c="dimmed">Unsaved changes…</Text>
        </Group>
      );
    case 'saving':
      return (
        <Group gap={6}>
          <Loader size="xs" />
          <Text size="sm" c="dimmed">Saving…</Text>
        </Group>
      );
    case 'blocked':
      return (
        <Group gap={6}>
          <IconAlertTriangle size={16} color="var(--mantine-color-yellow-7)" />
          <Text size="sm" c="dimmed">{blockedReason}</Text>
        </Group>
      );
    case 'error':
      return (
        <Group gap={6}>
          <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
          <Text size="sm" c="red">{error || 'Save failed'}</Text>
          <Button variant="subtle" size="xs" onClick={onRetry}>
            Retry
          </Button>
        </Group>
      );
    case 'saved':
    default:
      return (
        <Group gap={6}>
          <IconCheck size={16} color="var(--mantine-color-green-6)" />
          <Text size="sm" c="dimmed">All changes saved</Text>
        </Group>
      );
  }
}

/**
 * Inline editor for the gym's schedule template
 * Handles template metadata and days/timeslots configuration with autosave
 */
export function ScheduleTemplateEditor({
  template,
  gymId,
  coaches,
  onDeleteRequest,
}: ScheduleTemplateEditorProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<DayConfigData[]>([]);

  // Guards the dirty-check effect below from running against stale state
  // during the render where initialization is still in flight (state updates
  // from the init effect aren't visible to other effects in the same commit).
  const [initializing, setInitializing] = useState(true);

  // Autosave state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedRef = useRef<FormSnapshot | null>(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);

  // Initialize local state whenever a different template is loaded
  useEffect(() => {
    const loadedDays: DayConfigData[] = template.days.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      timeSlots: day.timeSlots.map((ts) => ({
        id: ts.id,
        startTime: ts.startTime,
        endTime: ts.endTime,
        capacity: ts.capacity,
        coachIds: ts.coachIds || [],
        location: ts.location || '',
        assignedClients: ts.assignedClients || [],
      })),
    }));

    setName(template.name);
    setDescription(template.description || '');
    setDays(loadedDays);

    lastSavedRef.current = {
      name: template.name,
      description: template.description || '',
      days: loadedDays,
    };
    setInitializing(false);
  }, [template.id]);

  const debouncedAutosave = useDebouncedCallback(() => {
    void performAutosave();
  }, { delay: 800, flushOnUnmount: true });

  const performAutosave = async () => {
    if (!name.trim() || days.length === 0) {
      setSaveStatus('blocked');
      return;
    }

    if (inFlightRef.current) {
      // A save is already in flight; run once more when it settles instead
      // of firing an overlapping second request.
      pendingRef.current = true;
      return;
    }

    const snapshot: FormSnapshot = { name, description, days };
    inFlightRef.current = true;
    setSaveStatus('saving');

    try {
      const updateData: UpdateScheduleTemplateRequest = {
        name: snapshot.name.trim(),
        description: snapshot.description.trim() || undefined,
        days: snapshot.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          timeSlots: day.timeSlots.map((ts) => ({
            id: ts.id,
            startTime: ts.startTime,
            endTime: ts.endTime,
            capacity: ts.capacity,
            coachIds: ts.coachIds,
            location: ts.location,
            assignedClients: ts.assignedClients || [],
          })),
        })),
      };

      await scheduleApi.updateTemplate(template.id, updateData);

      lastSavedRef.current = snapshot;
      setSaveError(null);
      setSaveStatus('saved');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
      setSaveStatus('error');
    } finally {
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        debouncedAutosave();
      }
    }
  };

  // Trigger a debounced autosave whenever the form state changes
  useEffect(() => {
    if (initializing || !lastSavedRef.current) return; // not initialized yet

    const current: FormSnapshot = { name, description, days };
    if (JSON.stringify(current) === JSON.stringify(lastSavedRef.current)) return;

    if (!name.trim() || days.length === 0) {
      setSaveStatus('blocked');
      return;
    }

    setSaveStatus('pending');
    debouncedAutosave();
  }, [name, description, days, initializing]);

  const blockedReason = !name.trim()
    ? 'Add a template name to save'
    : 'Add at least one day to save';

  const handleDayChange = (dayOfWeek: number, day: DayConfigData) => {
    const newDays = [...days];
    const dayIndex = newDays.findIndex(d => d.dayOfWeek === dayOfWeek);
    if (dayIndex !== -1) {
      newDays[dayIndex] = day;
      setDays(newDays);
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="flex-end">
        {renderSaveStatus(saveStatus, saveError, blockedReason, () => void performAutosave())}
        <Button
          variant="light"
          color="red"
          leftSection={<IconTrash size={16} />}
          onClick={onDeleteRequest}
        >
          Delete Template
        </Button>
      </Group>

      {/* Basic Information */}
      <Paper withBorder shadow="sm" p="md">
        <Stack gap="md">
          <Text fw={600} size="lg">
            Basic Information
          </Text>
          <TextInput
            label="Template Name"
            placeholder="e.g., Weekly Schedule"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />
          <Textarea
            label="Description"
            placeholder="Describe this schedule template..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            rows={3}
          />
        </Stack>
      </Paper>

      <Divider />

      {/* Days Configuration */}
      <Stack gap="md">
        <Text fw={600} size="lg">
          Schedule Days
        </Text>
        <Text size="sm" c="dimmed">
          Configure timeslots for each day of the week
        </Text>

        <Stack gap="md">
          {days
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map((day) => (
              <DayConfigCard
                key={day.dayOfWeek}
                day={day}
                gymId={gymId}
                coaches={coaches}
                onChange={(updatedDay) => handleDayChange(day.dayOfWeek, updatedDay)}
              />
            ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
