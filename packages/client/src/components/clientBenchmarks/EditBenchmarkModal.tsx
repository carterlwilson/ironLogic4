import { Modal, Stack, Group, Button, NumberInput, TextInput, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { parseTimeString, validateTimeString, formatTimeSeconds } from '../../utils/benchmarkFormatters';

interface EditBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  benchmark: ClientBenchmark | null;
  onSubmit: (benchmark: ClientBenchmark) => Promise<void>;
  loading?: boolean;
}

interface FormValues {
  weightKg?: number;
  timeString?: string;
  reps?: number;
  otherNotes?: string;
  notes?: string;
  recordedAt: Date;
}

export function EditBenchmarkModal({
  opened,
  onClose,
  benchmark,
  onSubmit,
  loading = false,
}: EditBenchmarkModalProps) {
  const form = useForm<FormValues>({
    initialValues: {
      recordedAt: new Date(),
      notes: '',
    },
    validate: {
      weightKg: (value) => {
        if (benchmark?.type === BenchmarkType.WEIGHT && !value) {
          return 'Weight is required';
        }
        if (benchmark?.type === BenchmarkType.WEIGHT && value !== undefined && value <= 0) {
          return 'Weight must be greater than 0';
        }
        return null;
      },
      timeString: (value) => {
        if (benchmark?.type === BenchmarkType.TIME && !value) {
          return 'Time is required';
        }
        if (benchmark?.type === BenchmarkType.TIME && value && !validateTimeString(value)) {
          return 'Invalid time format (use MM:SS)';
        }
        return null;
      },
      reps: (value) => {
        if (benchmark?.type === BenchmarkType.REPS && !value) {
          return 'Reps are required';
        }
        if (benchmark?.type === BenchmarkType.REPS && value !== undefined && value <= 0) {
          return 'Reps must be greater than 0';
        }
        return null;
      },
      otherNotes: (value) => {
        if (benchmark?.type === BenchmarkType.OTHER && !value) {
          return 'Notes are required';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (benchmark) {
      const values: FormValues = {
        recordedAt: new Date(benchmark.recordedAt),
        notes: benchmark.notes || '',
      };

      if (benchmark.type === BenchmarkType.WEIGHT) {
        values.weightKg = benchmark.weightKg;
      } else if (benchmark.type === BenchmarkType.TIME) {
        values.timeString = benchmark.timeSeconds ? formatTimeSeconds(benchmark.timeSeconds) : '';
      } else if (benchmark.type === BenchmarkType.REPS) {
        values.reps = benchmark.reps;
      } else if (benchmark.type === BenchmarkType.OTHER) {
        values.otherNotes = benchmark.otherNotes;
      }

      form.setValues(values);
    }
  }, [benchmark]);

  const handleSubmit = async (values: FormValues) => {
    if (!benchmark) return;

    const updatedBenchmark: ClientBenchmark = {
      ...benchmark,
      recordedAt: values.recordedAt,
      notes: values.notes,
    };

    // Update measurement based on type
    if (benchmark.type === BenchmarkType.WEIGHT && values.weightKg) {
      updatedBenchmark.weightKg = values.weightKg;
    } else if (benchmark.type === BenchmarkType.TIME && values.timeString) {
      updatedBenchmark.timeSeconds = parseTimeString(values.timeString);
    } else if (benchmark.type === BenchmarkType.REPS && values.reps) {
      updatedBenchmark.reps = values.reps;
    } else if (benchmark.type === BenchmarkType.OTHER && values.otherNotes) {
      updatedBenchmark.otherNotes = values.otherNotes;
    }

    try {
      await onSubmit(updatedBenchmark);
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

  if (!benchmark) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Edit Benchmark: ${benchmark.name}`}
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {benchmark.type === BenchmarkType.WEIGHT && (
            <NumberInput
              label="Weight"
              placeholder="Enter weight"
              min={0}
              step={0.5}
              suffix=" kg"
              required
              {...form.getInputProps('weightKg')}
            />
          )}

          {benchmark.type === BenchmarkType.TIME && (
            <TextInput
              label="Time"
              placeholder="MM:SS (e.g., 05:30)"
              required
              {...form.getInputProps('timeString')}
            />
          )}

          {benchmark.type === BenchmarkType.REPS && (
            <NumberInput
              label="Reps"
              placeholder="Enter number of reps"
              min={0}
              required
              {...form.getInputProps('reps')}
            />
          )}

          {benchmark.type === BenchmarkType.OTHER && (
            <Textarea
              label="Notes"
              placeholder="Enter measurement notes"
              required
              {...form.getInputProps('otherNotes')}
            />
          )}

          <DatePickerInput
            label="Recorded Date"
            placeholder="Select date"
            required
            {...form.getInputProps('recordedAt')}
          />

          <Textarea
            label="Personal Notes"
            placeholder="Add any additional notes"
            {...form.getInputProps('notes')}
          />

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
              color="forestGreen"
              loading={loading}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}