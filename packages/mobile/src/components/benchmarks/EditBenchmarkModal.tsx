import { Modal, Button, Stack, Textarea, TextInput, Text, Badge, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ClientBenchmark, BenchmarkType, UpdateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, getBenchmarkAgeInDays } from '../../utils/benchmarkUtils';

interface EditBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  onUpdate: (benchmarkId: string, data: UpdateMyBenchmarkInput) => Promise<void>;
  benchmark: ClientBenchmark | null;
  loading: boolean;
}

export function EditBenchmarkModal({
  opened,
  onClose,
  onUpdate,
  benchmark,
  loading,
}: EditBenchmarkModalProps) {
  const form = useForm<{
    recordedAt: string;
    notes: string;
    measurementValue: number | string | undefined;
  }>({
    initialValues: {
      recordedAt: '',
      notes: '',
      measurementValue: undefined,
    },
    validate: {
      recordedAt: (value) => (!value ? 'Please select a date' : null),
      measurementValue: (value) => {
        if (!benchmark) return null;

        if (benchmark.type === BenchmarkType.OTHER) {
          return !value ? 'Please enter measurement notes' : null;
        }

        if (benchmark.type === BenchmarkType.TIME) {
          if (!value) return 'Please enter a time value';
          if (typeof value === 'string' && !value.match(/^\d{2}:\d{2}$/)) {
            return 'Invalid time format. Use MM:SS';
          }
          return null;
        }

        return value === undefined || value === '' ? 'Please enter a measurement value' : null;
      },
    },
  });

  // Initialize form when benchmark changes
  useEffect(() => {
    if (benchmark && opened) {
      const measurementValue =
        benchmark.type === BenchmarkType.WEIGHT ? benchmark.weightKg :
        benchmark.type === BenchmarkType.TIME ? benchmark.timeSeconds :
        benchmark.type === BenchmarkType.REPS ? benchmark.reps :
        benchmark.otherNotes;

      form.setValues({
        recordedAt: formatDateForInput(benchmark.recordedAt),
        notes: benchmark.notes || '',
        measurementValue,
      });
    }
  }, [benchmark, opened]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!benchmark) return;

    const data: UpdateMyBenchmarkInput = {
      recordedAt: new Date(values.recordedAt),
      notes: values.notes || undefined,
    };

    // Add measurement based on type
    switch (benchmark.type) {
      case BenchmarkType.WEIGHT:
        data.weightKg = values.measurementValue as number;
        break;
      case BenchmarkType.TIME:
        data.timeSeconds = values.measurementValue as number;
        break;
      case BenchmarkType.REPS:
        data.reps = values.measurementValue as number;
        break;
      case BenchmarkType.OTHER:
        data.otherNotes = values.measurementValue as string;
        break;
    }

    await onUpdate(benchmark.id, data);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!benchmark) return null;

  const ageInDays = getBenchmarkAgeInDays(benchmark);
  const daysLeft = 7 - ageInDays;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Benchmark"
      size="lg"
      fullScreen
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Benchmark Info Header */}
          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="lg">
                {benchmark.name}
              </Text>
              <Badge color="forestGreen" variant="light" size="lg">
                {benchmark.type}
              </Badge>
            </Group>

            {daysLeft <= 2 && (
              <Badge color="yellow" variant="light" size="sm" fullWidth>
                Editable window closing in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <BenchmarkMeasurementInput
            type={benchmark.type}
            value={form.values.measurementValue}
            onChange={(value) => form.setFieldValue('measurementValue', value)}
            error={typeof form.errors.measurementValue === 'string' ? form.errors.measurementValue : undefined}
            required
          />

          <TextInput
            label="Date Recorded"
            type="date"
            {...form.getInputProps('recordedAt')}
            required
            size="lg"
            description="When did you achieve this benchmark?"
          />

          <Textarea
            label="Notes (Optional)"
            placeholder="Add any additional notes..."
            {...form.getInputProps('notes')}
            minRows={3}
            maxRows={5}
            size="lg"
            description="Any context or details about this measurement"
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}