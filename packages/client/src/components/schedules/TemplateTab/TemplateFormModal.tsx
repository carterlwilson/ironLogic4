import { Modal, Stack, Select, Button, Group, Text, NumberInput } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconCalendar } from '@tabler/icons-react';
import type { IScheduleTemplate, CreateScheduleTemplateRequest, UpdateScheduleTemplateRequest, DayOfWeek } from '@ironlogic4/shared';
import type { Coach } from '../../../hooks/useCoaches';
import { getAllDayOptions } from '../../../utils/scheduleUtils';

interface TemplateFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateScheduleTemplateRequest | UpdateScheduleTemplateRequest) => Promise<void>;
  loading?: boolean;
  coaches: Coach[];
  coachesLoading: boolean;
  editingTemplate?: IScheduleTemplate | null;
}

interface FormValues {
  coachId: string;
  dayOfWeek: string;
  period: string;
  time: string;
  endTime: string;
  maxCapacity: number;
}

export function TemplateFormModal({
  opened,
  onClose,
  onSubmit,
  loading = false,
  coaches,
  coachesLoading,
  editingTemplate,
}: TemplateFormModalProps) {
  const isEditing = !!editingTemplate;

  const coachOptions = coaches.map((coach) => ({
    value: coach.id,
    label: `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim() || coach.email,
  }));

  const form = useForm<FormValues>({
    initialValues: {
      coachId: editingTemplate?.coachId ?? '',
      dayOfWeek: editingTemplate?.dayOfWeek?.toString() ?? '',
      period: editingTemplate?.period ?? '',
      time: editingTemplate?.time ?? '',
      endTime: editingTemplate?.endTime ?? '',
      maxCapacity: editingTemplate?.maxCapacity ?? 10,
    },
    validate: {
      coachId: (v) => (!v ? 'Coach is required' : null),
      dayOfWeek: (v) => (!v ? 'Day is required' : null),
      period: (v) => (!v ? 'Period is required' : null),
      time: (v) => (!v ? 'Start time is required' : null),
      endTime: (v, values) => {
        if (!v) return 'End time is required';
        if (values.time && v <= values.time) return 'End time must be after start time';
        return null;
      },
      maxCapacity: (v) => (v < 1 ? 'Capacity must be at least 1' : null),
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      const data = {
        coachId: values.coachId,
        dayOfWeek: Number(values.dayOfWeek) as DayOfWeek,
        period: values.period as 'AM' | 'PM',
        time: values.time,
        endTime: values.endTime,
        maxCapacity: values.maxCapacity,
      };
      await onSubmit(data);
      form.reset();
      onClose();
    } catch {
      // error notifications handled by parent
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconCalendar size={20} />
          <Text size="lg" fw={600}>
            {isEditing ? 'Edit Template' : 'Add Template'}
          </Text>
        </Group>
      }
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {isEditing && (
            <Text size="sm" c="dimmed">
              Changes apply to future generated sessions only — existing sessions are not affected.
            </Text>
          )}

          <Select
            label="Day of Week"
            placeholder="Select day"
            data={getAllDayOptions()}
            required
            {...form.getInputProps('dayOfWeek')}
          />

          <Select
            label="Period"
            placeholder="AM or PM"
            data={[
              { value: 'AM', label: 'AM' },
              { value: 'PM', label: 'PM' },
            ]}
            required
            {...form.getInputProps('period')}
          />

          <Group grow>
            <TimeInput
              label="Start Time"
              required
              {...form.getInputProps('time')}
            />
            <TimeInput
              label="End Time"
              required
              {...form.getInputProps('endTime')}
            />
          </Group>

          <NumberInput
            label="Max Capacity"
            min={1}
            required
            {...form.getInputProps('maxCapacity')}
          />

          <Select
            label="Coach"
            placeholder="Select coach"
            data={coachOptions}
            required
            disabled={coachesLoading}
            searchable
            {...form.getInputProps('coachId')}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Save Changes' : 'Add Template'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
