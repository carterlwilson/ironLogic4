import { Modal, Stack, TextInput, Textarea, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput } from '../../utils/benchmarkUtils';
import { parseTimeString, validateTimeString } from '../../utils/benchmarkFormatters';

interface CreateBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  template: BenchmarkTemplate | null;
  onCreate: (data: CreateMyBenchmarkInput) => Promise<void>;
}

interface FormValues {
  recordedAt: string;
  notes: string;
  measurementValue: number | string | undefined;
}

export function CreateBenchmarkModal({
  opened,
  onClose,
  template,
  onCreate,
}: CreateBenchmarkModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      recordedAt: formatDateForInput(new Date()),
      notes: '',
      measurementValue: undefined,
    },
    validate: {
      recordedAt: (value) => (!value ? 'Date is required' : null),
      measurementValue: (value) => {
        if (value === undefined || value === null || value === '') {
          return 'Measurement is required';
        }

        // Special validation for time format
        if (template?.type === BenchmarkType.TIME) {
          if (typeof value === 'string' && !validateTimeString(value)) {
            return 'Invalid time format. Use MM:SS';
          }
        }

        return null;
      },
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!template) return;

    setLoading(true);
    try {
      // Build the request based on the benchmark type
      const data: CreateMyBenchmarkInput = {
        templateId: template.id,
        recordedAt: new Date(values.recordedAt),
        notes: values.notes || undefined,
      };

      // Add the appropriate measurement field
      switch (template.type) {
        case BenchmarkType.WEIGHT:
          data.weightKg = values.measurementValue as number;
          break;
        case BenchmarkType.TIME:
          // Convert time string to seconds if needed
          if (typeof values.measurementValue === 'string') {
            data.timeSeconds = parseTimeString(values.measurementValue);
          } else {
            data.timeSeconds = values.measurementValue as number;
          }
          break;
        case BenchmarkType.REPS:
          data.reps = values.measurementValue as number;
          break;
        case BenchmarkType.OTHER:
          data.otherNotes = values.measurementValue as string;
          break;
      }

      await onCreate(data);
      form.reset();
      onClose();
    } catch (error) {
      // Error is handled by the parent hook
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!template) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Create Benchmark: ${template.name}`}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Date Recorded"
            type="date"
            required
            {...form.getInputProps('recordedAt')}
            max={formatDateForInput(new Date())}
          />

          <BenchmarkMeasurementInput
            type={template.type}
            value={form.values.measurementValue}
            onChange={(value) => form.setFieldValue('measurementValue', value)}
            error={form.errors.measurementValue as string | undefined}
            required
          />

          <Textarea
            label="Notes"
            placeholder="Add any notes about this benchmark..."
            minRows={3}
            maxRows={6}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Benchmark
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}