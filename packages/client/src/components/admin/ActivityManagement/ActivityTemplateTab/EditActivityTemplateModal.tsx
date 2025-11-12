import { Modal, Stack, Group, TextInput, Textarea, Button, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconActivity } from '@tabler/icons-react';
import { useEffect } from 'react';
import { ActivityType } from '@ironlogic4/shared/types/activityTemplates';
import type { ActivityTemplate, UpdateActivityTemplateRequest } from '@ironlogic4/shared/types/activityTemplates';
import type { ActivityGroupOption } from '../../../../hooks/useActivityGroupOptions';

interface EditActivityTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  template: ActivityTemplate | null;
  onSubmit: (templateId: string, data: UpdateActivityTemplateRequest) => Promise<void>;
  onDelete: (template: ActivityTemplate) => void;
  loading?: boolean;
  groupOptions: ActivityGroupOption[];
  groupsLoading: boolean;
}

const typeOptions = [
  { value: ActivityType.LIFT, label: 'Lift' },
  { value: ActivityType.CARDIO, label: 'Cardio' },
  { value: ActivityType.BENCHMARK, label: 'Benchmark' },
  { value: ActivityType.OTHER, label: 'Other' },
];

export function EditActivityTemplateModal({
  opened,
  onClose,
  template,
  onSubmit,
  onDelete,
  loading = false,
  groupOptions,
  groupsLoading,
}: EditActivityTemplateModalProps) {

  const form = useForm<UpdateActivityTemplateRequest>({
    initialValues: {
      name: '',
      notes: '',
      groupId: '',
      type: ActivityType.LIFT,
    },
    validate: {
      name: (value) => {
        if (!value?.trim()) return 'Name is required';
        if (value.trim().length < 1) return 'Name must be at least 1 character';
        if (value.trim().length > 100) return 'Name must be less than 100 characters';
        return null;
      },
      notes: (value) => {
        if (value && value.length > 500) return 'Notes must be less than 500 characters';
        return null;
      },
      type: (value) => {
        if (!value) return 'Type is required';
        return null;
      },
    },
  });

  // Update form values when template changes
  useEffect(() => {
    if (template) {
      form.setValues({
        name: template.name,
        notes: template.notes || '',
        groupId: template.groupId || '',
        type: template.type,
      });
    }
  }, [template]);

  const handleSubmit = async (values: UpdateActivityTemplateRequest) => {
    if (!template) return;

    try {
      // Remove groupId if it's an empty string
      const submitData = {
        ...values,
        groupId: values.groupId || undefined,
      };
      await onSubmit(template.id, submitData);
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleDelete = () => {
    if (template) {
      onDelete(template);
    }
  };

  if (!template) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Activity Template"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="Enter template name"
            leftSection={<IconActivity size={16} />}
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Activity Type"
            placeholder="Select activity type"
            data={typeOptions}
            required
            {...form.getInputProps('type')}
          />

          <Select
            label="Activity Group"
            placeholder="Select group (optional)"
            data={groupOptions}
            disabled={groupsLoading}
            searchable
            clearable
            {...form.getInputProps('groupId')}
          />

          <Textarea
            label="Notes"
            placeholder="Add optional notes or description"
            minRows={3}
            maxRows={6}
            {...form.getInputProps('notes')}
          />

          {/* Actions */}
          <Group justify="space-between" gap="md" mt="md">
            <Button
              variant="light"
              color="red"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>

            <Group gap="md">
              <Button
                variant="subtle"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="forestGreen"
                loading={loading}
                disabled={!form.isValid()}
              >
                Save Changes
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}