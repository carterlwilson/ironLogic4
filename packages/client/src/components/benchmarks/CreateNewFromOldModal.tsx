import { Modal, Stack, TextInput, Textarea, Button, Group, Text, Badge, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, formatDate } from '../../utils/benchmarkUtils';
import { formatMeasurement } from '../../utils/benchmarkFormatters';
import { parseTimeString, validateTimeString } from '../../utils/benchmarkFormatters';
import { getBenchmarkTemplate } from '../../services/benchmarkApi';
import { IconWeight, IconCalendar } from '@tabler/icons-react';

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
  const [fullTemplate, setFullTemplate] = useState<BenchmarkTemplate | null>(null);
  const [repMaxValues, setRepMaxValues] = useState<Record<string, number | string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      recordedAt: formatDateForInput(new Date()),
      notes: '',
      measurementValue: undefined,
    },
    validate: {
      recordedAt: (value) => (!value ? 'Date is required' : null),
      measurementValue: (value) => {
        // Skip validation for WEIGHT type as we'll validate repMaxes separately
        if (oldBenchmark?.type === BenchmarkType.WEIGHT) {
          return null;
        }

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

  // Reset form and load template when oldBenchmark changes
  useEffect(() => {
    if (oldBenchmark) {
      form.setValues({
        recordedAt: formatDateForInput(new Date()),
        notes: '',
        measurementValue: undefined,
      });

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
  }, [oldBenchmark]);

  const updateRepMaxValue = (templateRepMaxId: string, value: string | number) => {
    setRepMaxValues((prev) => ({
      ...prev,
      [templateRepMaxId]: value,
    }));
  };

  const handleSubmit = async (values: FormValues) => {
    if (!oldBenchmark) return;

    setLoading(true);
    try {
      // Build the request based on the benchmark type
      const data: CreateMyBenchmarkInput = {
        templateId: oldBenchmark.templateId,
        notes: values.notes || undefined,
      };

      // Add measurement based on type
      if (oldBenchmark.type === BenchmarkType.WEIGHT) {
        // Build repMaxes array from repMaxValues
        const repMaxes = Object.entries(repMaxValues)
          .filter(([_, value]) => value !== '' && value !== undefined)
          .map(([templateRepMaxId, weightKg]) => ({
            templateRepMaxId,
            weightKg: typeof weightKg === 'string' ? parseFloat(weightKg) : weightKg,
            recordedAt: new Date(values.recordedAt),
          }));

        // Validate at least one rep max
        if (repMaxes.length === 0) {
          form.setFieldError('measurementValue', 'Please enter at least one rep max');
          setLoading(false);
          return;
        }

        data.repMaxes = repMaxes;
      } else {
        // For non-WEIGHT types, use recordedAt from form
        data.recordedAt = new Date(values.recordedAt);

        switch (oldBenchmark.type) {
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
      }

      await onCreate(oldBenchmark, data);
      form.reset();
      setRepMaxValues({});
      onClose();
    } catch (error) {
      // Error is handled by the parent hook
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setRepMaxValues({});
    onClose();
  };

  if (!oldBenchmark) {
    return null;
  }

  // Get the recordedAt date - prefer recordedAt field, fallback to first repMax
  const displayDate = oldBenchmark.recordedAt || oldBenchmark.repMaxes?.[0]?.recordedAt;

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
                {displayDate ? formatDate(displayDate) : 'N/A'}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Previous Result:
              </Text>
              <Badge color="forestGreen" variant="light">
                {formatMeasurement(
                  oldBenchmark.type,
                  undefined, // weightKg is deprecated
                  oldBenchmark.timeSeconds,
                  oldBenchmark.reps,
                  oldBenchmark.otherNotes,
                  oldBenchmark.repMaxes
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
            {oldBenchmark.type === BenchmarkType.WEIGHT ? (
              <>
                {loadingTemplate ? (
                  <Text size="sm" c="dimmed">Loading rep max options...</Text>
                ) : fullTemplate?.templateRepMaxes && fullTemplate.templateRepMaxes.length > 0 ? (
                  <>
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
                          />
                        ))}
                      {form.errors.measurementValue && (
                        <Text size="sm" c="red">{form.errors.measurementValue}</Text>
                      )}
                    </Stack>

                    <TextInput
                      label="Date Recorded"
                      type="date"
                      {...form.getInputProps('recordedAt')}
                      required
                      max={formatDateForInput(new Date())}
                      leftSection={<IconCalendar size={16} />}
                      description="When did you achieve these rep maxes?"
                    />
                  </>
                ) : (
                  <Text size="sm" c="red">No rep max options available for this template</Text>
                )}

                <Textarea
                  label="Notes (Optional)"
                  placeholder="Add any additional notes..."
                  {...form.getInputProps('notes')}
                  minRows={3}
                  maxRows={6}
                  description="Any context or details about this measurement"
                />
              </>
            ) : (
              <>
                <BenchmarkMeasurementInput
                  type={oldBenchmark.type}
                  value={form.values.measurementValue}
                  onChange={(value) => form.setFieldValue('measurementValue', value)}
                  error={form.errors.measurementValue as string | undefined}
                  required
                />

                <TextInput
                  label="Date Recorded"
                  type="date"
                  required
                  {...form.getInputProps('recordedAt')}
                  max={formatDateForInput(new Date())}
                  description="When did you achieve this benchmark?"
                />

                <Textarea
                  label="Notes"
                  placeholder="Add any notes about this benchmark..."
                  minRows={3}
                  maxRows={6}
                  {...form.getInputProps('notes')}
                />
              </>
            )}

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