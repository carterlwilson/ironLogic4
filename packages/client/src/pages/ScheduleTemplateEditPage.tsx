import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Textarea,
  MultiSelect,
  Button,
  Loader,
  Paper,
  Divider,
} from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconArrowLeft, IconCheck, IconAlertCircle, IconAlertTriangle } from '@tabler/icons-react';
import type { UpdateScheduleTemplateRequest } from '@ironlogic4/shared';
import { scheduleApi } from '../services/scheduleApi';
import { useCoaches } from '../hooks/useCoaches';
import { useAuth } from '../providers/AuthProvider';
import { DayConfigCard, type DayConfigData } from '../components/schedules/TemplateEdit';

type SaveStatus = 'saved' | 'pending' | 'saving' | 'blocked' | 'error';

interface FormSnapshot {
  name: string;
  description: string;
  coachIds: string[];
  days: DayConfigData[];
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
 * Full-page editor for editing schedule templates
 * Handles template metadata and days/timeslots configuration
 */
export function ScheduleTemplateEditPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const gymId = user?.gymId || '';

  // State
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coachIds, setCoachIds] = useState<string[]>([]);
  const [days, setDays] = useState<DayConfigData[]>([]);

  // Autosave state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSavedRef = useRef<FormSnapshot | null>(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);

  // Fetch coaches
  const { coaches, loading: coachesLoading } = useCoaches(gymId);

  const coachOptions = coaches.map((coach) => ({
    value: coach.id,
    label: `${coach.firstName} ${coach.lastName}`.trim() || coach.email,
  }));

  // Load template on mount
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) {
        navigate('/schedules');
        return;
      }

      try {
        setLoading(true);
        const response = await scheduleApi.getTemplate(templateId);
        const loadedTemplate = response.data;

        if (!loadedTemplate) {
          throw new Error('Template not found');
        }

        const loadedDays: DayConfigData[] = loadedTemplate.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          timeSlots: day.timeSlots.map((ts) => ({
            id: ts.id,
            startTime: ts.startTime,
            endTime: ts.endTime,
            capacity: ts.capacity,
            assignedClients: ts.assignedClients || [],
          })),
        }));

        setName(loadedTemplate.name);
        setDescription(loadedTemplate.description || '');
        setCoachIds(loadedTemplate.coachIds);
        setDays(loadedDays);

        lastSavedRef.current = {
          name: loadedTemplate.name,
          description: loadedTemplate.description || '',
          coachIds: loadedTemplate.coachIds,
          days: loadedDays,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load template';
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          autoClose: 5000,
        });
        navigate('/schedules');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, navigate]);

  const debouncedAutosave = useDebouncedCallback(() => {
    void performAutosave();
  }, { delay: 800, flushOnUnmount: true });

  const performAutosave = async () => {
    if (!templateId) return;

    if (!name.trim() || coachIds.length === 0 || days.length === 0) {
      setSaveStatus('blocked');
      return;
    }

    if (inFlightRef.current) {
      // A save is already in flight; run once more when it settles instead
      // of firing an overlapping second request.
      pendingRef.current = true;
      return;
    }

    const snapshot: FormSnapshot = { name, description, coachIds, days };
    inFlightRef.current = true;
    setSaveStatus('saving');

    try {
      const updateData: UpdateScheduleTemplateRequest = {
        name: snapshot.name.trim(),
        description: snapshot.description.trim() || undefined,
        coachIds: snapshot.coachIds,
        days: snapshot.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          timeSlots: day.timeSlots.map((ts) => ({
            id: ts.id,
            startTime: ts.startTime,
            endTime: ts.endTime,
            capacity: ts.capacity,
            assignedClients: ts.assignedClients || [],
          })),
        })),
      };

      await scheduleApi.updateTemplate(templateId, updateData);

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
    if (!lastSavedRef.current) return; // template hasn't loaded yet

    const current: FormSnapshot = { name, description, coachIds, days };
    if (JSON.stringify(current) === JSON.stringify(lastSavedRef.current)) return;

    if (!name.trim() || coachIds.length === 0 || days.length === 0) {
      setSaveStatus('blocked');
      return;
    }

    setSaveStatus('pending');
    debouncedAutosave();
  }, [name, description, coachIds, days]);

  const blockedReason = !name.trim()
    ? 'Add a template name to save'
    : coachIds.length === 0
    ? 'Add at least one coach to save'
    : 'Add at least one day to save';

  const handleDayChange = (dayOfWeek: number, day: DayConfigData) => {
    const newDays = [...days];
    const dayIndex = newDays.findIndex(d => d.dayOfWeek === dayOfWeek);
    if (dayIndex !== -1) {
      newDays[dayIndex] = day;
      setDays(newDays);
    }
  };

  const handleBack = () => navigate('/schedules');

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading template...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Page Header */}
        <Group justify="space-between">
          <Group gap="sm">
            <IconCalendar size={32} color="#3b82f6" />
            <div>
              <Title order={1}>Edit Schedule Template</Title>
              <Text size="sm" c="dimmed">
                Configure template details, days, and timeslots
              </Text>
            </div>
          </Group>
          <Group gap="sm">
            {renderSaveStatus(saveStatus, saveError, blockedReason, () => void performAutosave())}
            <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={handleBack}>
              Back to Schedules
            </Button>
          </Group>
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
            <MultiSelect
              label="Coaches"
              placeholder="Select coaches"
              data={coachOptions}
              value={coachIds}
              onChange={setCoachIds}
              disabled={coachesLoading}
              searchable
              required
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
                  onChange={(updatedDay) => handleDayChange(day.dayOfWeek, updatedDay)}
                />
              ))}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}