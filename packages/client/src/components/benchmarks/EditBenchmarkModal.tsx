import { Modal, Stack, TextInput, Textarea, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import type { UpdateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput } from '../../utils/benchmarkUtils';
import { parseTimeString, validateTimeString } from '../../utils/benchmarkFormatters';

interface EditBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  benchmark: ClientBenchmark | null;
  onUpdate: (benchmarkId: string, data: UpdateMyBenchmarkInput) => Promise<void>;
}

interface FormValues {
  recordedAt: string;
  notes: string;
  measurementValue: number | string | undefined;
}

export function EditBenchmarkModal({
  opened,
  onClose,
  benchmark,
  onUpdate,
}: EditBenchmarkModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      recordedAt: '',
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
        if (benchmark?.type === BenchmarkType.TIME) {
          if (typeof value === 'string' && !validateTimeString(value)) {
            return 'Invalid time format. Use MM:SS';
          }
        }

        return null;
      },
    },
  });

  // Populate form when benchmark changes
  useEffect(() => {
    if (benchmark) {
      // Get the current measurement value based on type
      let measurementValue: number | string | undefined;
      switch (benchmark.type) {
        case BenchmarkType.WEIGHT:
          measurementValue = benchmark.weightKg;
          break;
        case BenchmarkType.TIME:
          measurementValue = benchmark.timeSeconds;
          break;
        case BenchmarkType.REPS:
          measurementValue = benchmark.reps;
          break;
        case BenchmarkType.OTHER:
          measurementValue = benchmark.otherNotes;
          break;
      }

      form.setValues({
        recordedAt: formatDateForInput(benchmark.recordedAt),
        notes: benchmark.notes || '',
        measurementValue,
      });
    }
  }, [benchmark]);

  const handleSubmit = async (values: FormValues) => {
    if (!benchmark) return;

    setLoading(true);
    try {
      // Build the update request
      const data: UpdateMyBenchmarkInput = {
        recordedAt: new Date(values.recordedAt),
        notes: values.notes || undefined,
      };

      // Add the appropriate measurement field
      switch (benchmark.type) {
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

      await onUpdate(benchmark.id, data);
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

  if (!benchmark) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Edit Benchmark: ${benchmark.name}`}
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
            type={benchmark.type}
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
              Update Benchmark
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}