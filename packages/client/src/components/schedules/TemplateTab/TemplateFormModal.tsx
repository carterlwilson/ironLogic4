import { Modal, Stack, TextInput, Textarea, Button, Group, MultiSelect, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCalendar } from '@tabler/icons-react';
import type {
  CreateScheduleTemplateRequest,
} from '@ironlogic4/shared';
import type { Coach } from '../../../hooks/useCoaches';

interface TemplateFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateScheduleTemplateRequest) => Promise<void>;
  loading?: boolean;
  coaches: Coach[];
  coachesLoading: boolean;
}

interface FormValues {
  name: string;
  description: string;
  coachIds: string[];
}

/**
 * Modal for creating schedule templates
 * Only handles basic info - days/timeslots configured in edit page
 */
export function TemplateFormModal({
  opened,
  onClose,
  onSubmit,
  loading = false,
  coaches,
  coachesLoading,
}: TemplateFormModalProps) {
  const coachOptions = coaches.map((coach) => ({
    value: coach.id,
    label: `${coach.firstName} ${coach.lastName}`.trim() || coach.email,
  }));

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      coachIds: [],
    },
    validate: {
      name: (value) => {
        if (!value?.trim()) return 'Name is required';
        if (value.trim().length > 100) return 'Name must be less than 100 characters';
        return null;
      },
      description: (value) => {
        if (value && value.length > 500) return 'Description must be less than 500 characters';
        return null;
      },
      coachIds: (value) => {
        if (!value || value.length === 0) return 'At least one coach is required';
        return null;
      },
    },
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      const submitData: CreateScheduleTemplateRequest = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        coachIds: values.coachIds,
        days: [], // Empty - will be configured in edit page
      };

      await onSubmit(submitData);
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error submitting template:', error);
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
          <IconCalendar size={24} />
          <Text size="lg" fw={600}>
            Create Schedule Template
          </Text>
        </Group>
      }
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="e.g., Weekly Schedule"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="Describe this schedule template..."
            rows={3}
            {...form.getInputProps('description')}
          />

          <MultiSelect
            label="Coaches"
            placeholder="Select coaches"
            data={coachOptions}
            required
            disabled={coachesLoading}
            searchable
            {...form.getInputProps('coachIds')}
          />

          <Text size="sm" c="dimmed">
            After creating the template, add timeslots to each day of the week in the edit page.
          </Text>

          {/* Action Buttons */}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Template
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}