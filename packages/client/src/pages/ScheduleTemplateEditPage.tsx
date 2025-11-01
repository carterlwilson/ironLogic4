import { useState, useEffect } from 'react';
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
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react';
import type { IScheduleTemplate, UpdateScheduleTemplateRequest } from '@ironlogic4/shared';
import { scheduleApi } from '../services/scheduleApi';
import { useCoaches } from '../hooks/useCoaches';
import { useAuth } from '../providers/AuthProvider';
import { DayConfigCard, type DayConfigData } from '../components/schedules/TemplateEdit';

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
  const [template, setTemplate] = useState<IScheduleTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coachIds, setCoachIds] = useState<string[]>([]);
  const [days, setDays] = useState<DayConfigData[]>([]);

  // Track if form has changes
  const [isDirty, setIsDirty] = useState(false);

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

        setTemplate(loadedTemplate);
        setName(loadedTemplate.name);
        setDescription(loadedTemplate.description || '');
        setCoachIds(loadedTemplate.coachIds);
        setDays(
          loadedTemplate.days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            timeSlots: day.timeSlots.map((ts) => ({
              id: ts.id,
              startTime: ts.startTime,
              endTime: ts.endTime,
              capacity: ts.capacity,
              assignedClients: ts.assignedClients || [],
            })),
          }))
        );
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

  // Track changes
  useEffect(() => {
    if (!template) return;

    const hasChanges =
      name !== template.name ||
      description !== (template.description || '') ||
      JSON.stringify(coachIds) !== JSON.stringify(template.coachIds) ||
      JSON.stringify(days) !== JSON.stringify(
        template.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          timeSlots: day.timeSlots.map((ts) => ({
            id: ts.id,
            startTime: ts.startTime,
            endTime: ts.endTime,
            capacity: ts.capacity,
            assignedClients: ts.assignedClients || [],
          })),
        }))
      );

    setIsDirty(hasChanges);
  }, [name, description, coachIds, days, template]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleDayChange = (dayOfWeek: number, day: DayConfigData) => {
    const newDays = [...days];
    const dayIndex = newDays.findIndex(d => d.dayOfWeek === dayOfWeek);
    if (dayIndex !== -1) {
      newDays[dayIndex] = day;
      setDays(newDays);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Template name is required',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }

    if (coachIds.length === 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'At least one coach is required',
        color: 'red',
        autoClose: 3000,
      });
      return;
    }

    if (!templateId) return;

    try {
      setSaving(true);

      const updateData: UpdateScheduleTemplateRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        coachIds,
        days: days.map((day) => ({
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

      notifications.show({
        title: 'Success',
        message: 'Template updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      setIsDirty(false);
      navigate('/schedules');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate('/schedules');
  };

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
            <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty}
            >
              Save Changes
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