import { Modal, Button, Stack, Textarea, TextInput, Text, Badge, Group, Paper, Divider, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { ClientBenchmark, BenchmarkType, CreateMyBenchmarkInput, BenchmarkTemplate } from '@ironlogic4/shared';
import { IconWeight, IconCalendar } from '@tabler/icons-react';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, formatMeasurement, formatDate, getBenchmarkAgeInDays, parseDateStringToLocalDate } from '../../utils/benchmarkUtils';
import { getBenchmarkTemplate } from '../../services/benchmarkApi';

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
  const [fullTemplate, setFullTemplate] = useState<BenchmarkTemplate | null>(null);
  const [repMaxValues, setRepMaxValues] = useState<Record<string, number | string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

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

        // Skip validation for WEIGHT type as we'll validate repMaxes separately
        if (oldBenchmark.type === BenchmarkType.WEIGHT) {
          return null;
        }

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

  // Load template and pre-fill rep maxes when modal opens
  useEffect(() => {
    if (opened && oldBenchmark) {
      form.reset();
      form.setFieldValue('recordedAt', formatDateForInput(new Date()));

      // For WEIGHT type, fetch template and pre-fill with old rep maxes
      if (oldBenchmark.type === BenchmarkType.WEIGHT && oldBenchmark.repMaxes) {
        setLoadingTemplate(true);
        getBenchmarkTemplate(oldBenchmark.templateId)
          .then((response) => {
            setFullTemplate(response.data);

            // Pre-fill with old rep maxes
            const prefilled: Record<string, number> = {};
            oldBenchmark.repMaxes?.forEach((repMax) => {
              prefilled[repMax.templateRepMaxId] = repMax.weightKg;
            });
            setRepMaxValues(prefilled);
          })
          .catch((error) => {
            console.error('Failed to load template details:', error);
          })
          .finally(() => {
            setLoadingTemplate(false);
          });
      } else {
        setFullTemplate(null);
        setRepMaxValues({});
      }
    }
  }, [opened, oldBenchmark]);

  const updateRepMaxValue = (templateRepMaxId: string, value: string | number) => {
    setRepMaxValues((prev) => ({
      ...prev,
      [templateRepMaxId]: value,
    }));
  };

  const handleSubmit = form.onSubmit(async (values) => {
    if (!oldBenchmark) return;

    const data: CreateMyBenchmarkInput = {
      templateId: oldBenchmark.templateId,
      notes: values.notes || undefined,
      oldBenchmarkId: oldBenchmark.id, // This triggers the move to historical
    };

    // Add measurement based on type
    if (oldBenchmark.type === BenchmarkType.WEIGHT) {
      // Create repMaxes for ALL templateRepMaxes (even if user didn't fill them in)
      const repMaxes = fullTemplate?.templateRepMaxes?.map(trm => {
        const value = repMaxValues[trm.id];
        return {
          templateRepMaxId: trm.id,
          weightKg: value && value !== ''
            ? (typeof value === 'string' ? parseFloat(value) : value)
            : 0,  // Default to 0 if empty
          recordedAt: parseDateStringToLocalDate(values.recordedAt),
        };
      }) || [];

      data.repMaxes = repMaxes;
    } else {
      // For non-WEIGHT types, use recordedAt from form
      data.recordedAt = parseDateStringToLocalDate(values.recordedAt);

      switch (oldBenchmark.type) {
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
    undefined, // weightKg is deprecated, use repMaxes instead
    oldBenchmark.timeSeconds,
    oldBenchmark.reps,
    oldBenchmark.otherNotes,
    oldBenchmark.repMaxes
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
                  {oldBenchmark.recordedAt && (
                    <>
                      <Text size="sm" c="dimmed">
                        {formatDate(oldBenchmark.recordedAt)}
                      </Text>
                      <Text size="sm" c="dimmed">
                        •
                      </Text>
                    </>
                  )}
                  <Text size="sm" fw={500}>
                    {oldMeasurement}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </div>

          <Divider label="New Benchmark" labelPosition="center" />

          {/* New Benchmark Form for WEIGHT type */}
          {oldBenchmark.type === BenchmarkType.WEIGHT && (
            <>
              {loadingTemplate ? (
                <Text size="sm" c="dimmed">Loading rep max options...</Text>
              ) : fullTemplate?.templateRepMaxes && fullTemplate.templateRepMaxes.length > 0 ? (
                <Stack gap="md">
                  <Text size="sm" fw={500}>Update your rep maxes (at least one required)</Text>
                  {fullTemplate.templateRepMaxes
                    .sort((a, b) => a.reps - b.reps)
                    .map((trm) => (
                      <NumberInput
                        key={trm.id}
                        label={`${trm.name} (${trm.reps} rep${trm.reps > 1 ? 's' : ''})`}
                        placeholder="Weight in kg"
                        value={repMaxValues[trm.id] || ''}
                        onChange={(val) => updateRepMaxValue(trm.id, val)}
                        min={0}
                        step={0.5}
                        decimalScale={1}
                        leftSection={<IconWeight size={16} />}
                        size="lg"
                      />
                    ))}
                  {form.errors.measurementValue && (
                    <Text size="sm" c="red">{form.errors.measurementValue}</Text>
                  )}
                </Stack>
              ) : (
                <Text size="sm" c="red">No rep max options available for this template</Text>
              )}

              <TextInput
                label="Date Recorded"
                type="date"
                {...form.getInputProps('recordedAt')}
                required
                max={formatDateForInput(new Date())}
                size="lg"
                leftSection={<IconCalendar size={16} />}
                description="When did you achieve these rep maxes?"
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
            </>
          )}

          {/* New Benchmark Form for non-WEIGHT types */}
          {oldBenchmark.type !== BenchmarkType.WEIGHT && (
            <>
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
            </>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Create New Benchmark
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}