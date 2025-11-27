import { Modal, Stack, Group, TextInput, Textarea, Button, Select, TagsInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBarbell } from '@tabler/icons-react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { CreateBenchmarkTemplateRequest, UpdateBenchmarkTemplateRequest } from '../../services/benchmarkTemplateApi';

interface BenchmarkTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBenchmarkTemplateRequest | UpdateBenchmarkTemplateRequest) => Promise<void>;
  loading?: boolean;
  gymId: string;
  template?: BenchmarkTemplate | null;
}

const benchmarkTypeOptions = [
  { value: BenchmarkType.WEIGHT, label: 'Weight' },
  { value: BenchmarkType.TIME, label: 'Time' },
  { value: BenchmarkType.REPS, label: 'Reps' },
  { value: BenchmarkType.OTHER, label: 'Other' },
];

export function BenchmarkTemplateModal({
  opened,
  onClose,
  onSubmit,
  loading = false,
  gymId,
  template,
}: BenchmarkTemplateModalProps) {
  const isEditMode = !!template;

  const form = useForm<CreateBenchmarkTemplateRequest>({
    initialValues: {
      name: template?.name || '',
      notes: template?.notes || '',
      type: template?.type || BenchmarkType.WEIGHT,
      tags: template?.tags || [],
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

  const handleSubmit = async (values: CreateBenchmarkTemplateRequest) => {
    try {
      if (isEditMode) {
        // For update, we don't send gymId
        const { gymId: _, ...updateData } = values;
        await onSubmit(updateData);
      } else {
        // Remove any existing templateRepMaxes from values to avoid contamination
        const { templateRepMaxes: _, ...cleanValues } = values as any;

        // For WEIGHT type benchmarks, automatically create default templateRepMaxes
        const templateRepMaxes = cleanValues.type === BenchmarkType.WEIGHT
          ? [
              { reps: 1, name: '1RM' },
                { reps: 2, name: '2RM' },
              { reps: 3, name: '3RM' },
              { reps: 5, name: '5RM' },
              { reps: 8, name: '8RM' },
            ]
          : undefined;

        // Only include templateRepMaxes if it's defined (WEIGHT type)
        const payload = templateRepMaxes
          ? { ...cleanValues, templateRepMaxes, gymId }
          : { ...cleanValues, gymId };

        await onSubmit(payload);
      }
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

  // Update form when template changes (for edit mode)
  React.useEffect(() => {
    if (template) {
      form.setValues({
        name: template.name,
        notes: template.notes || '',
        type: template.type,
        tags: template.tags || [],
        gymId,
      });
    } else {
      form.reset();
    }
  }, [template]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEditMode ? 'Edit Benchmark Template' : 'Add New Benchmark Template'}
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="Enter template name (e.g., Back Squat, 400m Run)"
            leftSection={<IconBarbell size={16} />}
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Benchmark Type"
            placeholder="Select type"
            data={benchmarkTypeOptions}
            required
            {...form.getInputProps('type')}
          />

          <TagsInput
            label="Tags"
            placeholder="Enter tags and press Enter"
            description="Optional tags for categorizing benchmarks"
            {...form.getInputProps('tags')}
          />

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
              {isEditMode ? 'Update Template' : 'Create Template'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// Import React for useEffect
import React from 'react';