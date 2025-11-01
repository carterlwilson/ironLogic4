import { Modal, Stack, Group, TextInput, Textarea, Button, Select, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconActivity } from '@tabler/icons-react';
import { ActivityType } from '@ironlogic4/shared/types/activityTemplates';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { CreateActivityTemplateRequest } from '@ironlogic4/shared/types/activityTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ActivityGroupOption } from '../../../../hooks/useActivityGroupOptions';

interface AddActivityTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateActivityTemplateRequest) => Promise<void>;
  loading?: boolean;
  gymId: string;
  groupOptions: ActivityGroupOption[];
  groupsLoading: boolean;
  benchmarkTemplates: BenchmarkTemplate[];
  benchmarksLoading: boolean;
}

const typeOptions = [
  { value: ActivityType.LIFT, label: 'Lift' },
  { value: ActivityType.CARDIO, label: 'Cardio' },
  { value: ActivityType.BENCHMARK, label: 'Benchmark' },
  { value: ActivityType.OTHER, label: 'Other' },
];

export function AddActivityTemplateModal({
  opened,
  onClose,
  onSubmit,
  loading = false,
  gymId,
  groupOptions,
  groupsLoading,
  benchmarkTemplates,
  benchmarksLoading,
}: AddActivityTemplateModalProps) {

  // Filter to only weight-based benchmarks
  const weightBenchmarkOptions = benchmarkTemplates
    .filter((template) => template.type === BenchmarkType.WEIGHT)
    .map((template) => ({
      value: template.id,
      label: template.name,
    }));

  const form = useForm<CreateActivityTemplateRequest>({
    initialValues: {
      name: '',
      notes: '',
      groupId: '',
      type: ActivityType.LIFT,
      benchmarkTemplateId: '',
      gymId,
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

  const handleSubmit = async (values: CreateActivityTemplateRequest) => {
    try {
      // Remove groupId and benchmarkTemplateId if they're empty strings
      const submitData = {
        ...values,
        gymId,
        groupId: values.groupId || undefined,
        benchmarkTemplateId: values.benchmarkTemplateId || undefined,
      };
      await onSubmit(submitData);
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

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add New Activity Template"
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

          {/* Conditionally show benchmark template selector for LIFT activities */}
          {form.values.type === ActivityType.LIFT && (
            <Select
              label="Benchmark Template"
              placeholder="Select benchmark template (optional)"
              description="Link to a benchmark for percentage-based weight calculations"
              data={weightBenchmarkOptions}
              disabled={benchmarksLoading}
              searchable
              clearable
              {...form.getInputProps('benchmarkTemplateId')}
            />
          )}

          {/* Show message if no weight benchmarks available for LIFT type */}
          {form.values.type === ActivityType.LIFT && weightBenchmarkOptions.length === 0 && !benchmarksLoading && (
            <Text size="sm" c="dimmed">
              No weight-based benchmark templates available. Create a weight benchmark template to link it here.
            </Text>
          )}

          <Textarea
            label="Notes"
            placeholder="Add optional notes or description"
            minRows={3}
            maxRows={6}
            {...form.getInputProps('notes')}
          />

          {/* Actions */}
          <Group justify="flex-end" gap="md" mt="md">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="green"
              loading={loading}
              disabled={!form.isValid()}
            >
              Create Template
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}