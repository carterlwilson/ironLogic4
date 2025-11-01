import { Modal, Stack, TextInput, Textarea, Button, Group, Text, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import type { CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, formatDate } from '../../utils/benchmarkUtils';
import { formatMeasurement } from '../../utils/benchmarkFormatters';
import { parseTimeString, validateTimeString } from '../../utils/benchmarkFormatters';

interface CreateNewFromOldModalProps {
  opened: boolean;
  onClose: () => void;
  oldBenchmark: ClientBenchmark | null;
  onCreate: (oldBenchmark: ClientBenchmark, data: CreateMyBenchmarkInput) => Promise<void>;
}

interface FormValues {
  recordedAt: string;
  notes: string;
  measurementValue: number | string | undefined;
}

export function CreateNewFromOldModal({
  opened,
  onClose,
  oldBenchmark,
  onCreate,
}: CreateNewFromOldModalProps) {
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
        if (oldBenchmark?.type === BenchmarkType.TIME) {
          if (typeof value === 'string' && !validateTimeString(value)) {
            return 'Invalid time format. Use MM:SS';
          }
        }

        return null;
      },
    },
  });

  // Reset form when oldBenchmark changes
  useEffect(() => {
    if (oldBenchmark) {
      form.setValues({
        recordedAt: formatDateForInput(new Date()),
        notes: '',
        measurementValue: undefined,
      });
    }
  }, [oldBenchmark]);

  const handleSubmit = async (values: FormValues) => {
    if (!oldBenchmark) return;

    setLoading(true);
    try {
      // Build the request based on the benchmark type
      const data: CreateMyBenchmarkInput = {
        templateId: oldBenchmark.templateId,
        recordedAt: new Date(values.recordedAt),
        notes: values.notes || undefined,
      };

      // Add the appropriate measurement field
      switch (oldBenchmark.type) {
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

      await onCreate(oldBenchmark, data);
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

  if (!oldBenchmark) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Create New Benchmark: ${oldBenchmark.name}`}
      size="md"
    >
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">
            Historical Benchmark Reference
          </Text>
          <Stack gap="xs" p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Date Recorded:
              </Text>
              <Text size="sm" fw={500}>
                {formatDate(oldBenchmark.recordedAt)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Previous Result:
              </Text>
              <Badge color="forestGreen" variant="light">
                {formatMeasurement(
                  oldBenchmark.type,
                  oldBenchmark.weightKg,
                  oldBenchmark.timeSeconds,
                  oldBenchmark.reps,
                  oldBenchmark.otherNotes
                )}
              </Badge>
            </Group>
            {oldBenchmark.notes && (
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Previous Notes:
                </Text>
                <Text size="sm" style={{ fontStyle: 'italic' }}>
                  {oldBenchmark.notes}
                </Text>
              </div>
            )}
          </Stack>
        </div>

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
              type={oldBenchmark.type}
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
                Create New Benchmark
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}