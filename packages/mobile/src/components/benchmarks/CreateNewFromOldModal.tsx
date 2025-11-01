import { Modal, Button, Stack, Textarea, TextInput, Text, Badge, Group, Paper, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ClientBenchmark, BenchmarkType, CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, formatMeasurement, formatDate, getBenchmarkAgeInDays } from '../../utils/benchmarkUtils';

interface CreateNewFromOldModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (data: CreateMyBenchmarkInput) => Promise<void>;
  oldBenchmark: ClientBenchmark | null;
  loading: boolean;
}

export function CreateNewFromOldModal({
  opened,
  onClose,
  onCreate,
  oldBenchmark,
  loading,
}: CreateNewFromOldModalProps) {
  const form = useForm<{
    recordedAt: string;
    notes: string;
    measurementValue: number | string | undefined;
  }>({
    initialValues: {
      recordedAt: formatDateForInput(new Date()),
      notes: '',
      measurementValue: undefined,
    },
    validate: {
      recordedAt: (value) => (!value ? 'Please select a date' : null),
      measurementValue: (value) => {
        if (!oldBenchmark) return null;

        if (oldBenchmark.type === BenchmarkType.OTHER) {
          return !value ? 'Please enter measurement notes' : null;
        }

        if (oldBenchmark.type === BenchmarkType.TIME) {
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

  // Reset form when modal opens
  useEffect(() => {
    if (opened) {
      form.reset();
      form.setFieldValue('recordedAt', formatDateForInput(new Date()));
    }
  }, [opened]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!oldBenchmark) return;

    const data: CreateMyBenchmarkInput = {
      templateId: oldBenchmark.templateId,
      recordedAt: new Date(values.recordedAt),
      notes: values.notes || undefined,
      oldBenchmarkId: oldBenchmark.id, // This triggers the move to historical
    };

    // Add measurement based on type
    switch (oldBenchmark.type) {
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

    await onCreate(data);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!oldBenchmark) return null;

  const oldMeasurement = formatMeasurement(
    oldBenchmark.type,
    oldBenchmark.weightKg,
    oldBenchmark.timeSeconds,
    oldBenchmark.reps,
    oldBenchmark.otherNotes
  );

  const ageInDays = getBenchmarkAgeInDays(oldBenchmark);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create New Benchmark"
      size="lg"
      fullScreen
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Info Text */}
          <Paper p="md" radius="md" bg="orange.0" withBorder>
            <Text size="sm" c="orange.9">
              This benchmark is {ageInDays} days old and can no longer be edited directly.
              Create a new benchmark to update your progress. The old benchmark will be moved to your history.
            </Text>
          </Paper>

          {/* Old Benchmark Reference */}
          <div>
            <Text size="xs" c="dimmed" mb="xs">
              Previous Benchmark
            </Text>
            <Paper p="md" radius="md" withBorder bg="gray.0">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={600}>
                    {oldBenchmark.name}
                  </Text>
                  <Badge color="gray" variant="light">
                    {oldBenchmark.type}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    {formatDate(oldBenchmark.recordedAt)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    •
                  </Text>
                  <Text size="sm" fw={500}>
                    {oldMeasurement}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </div>

          <Divider label="New Benchmark" labelPosition="center" />

          {/* New Benchmark Form */}
          <BenchmarkMeasurementInput
            type={oldBenchmark.type}
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
            Create New Benchmark
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}