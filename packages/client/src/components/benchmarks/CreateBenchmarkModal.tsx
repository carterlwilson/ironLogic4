import { Modal, Stack, TextInput, Textarea, Button, Group, NumberInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput } from '../../utils/benchmarkUtils';
import { parseTimeString, validateTimeString, parseDateStringToLocalDate } from '../../utils/benchmarkFormatters';
import { getBenchmarkTemplate } from '../../services/benchmarkApi';
import { IconWeight, IconCalendar } from '@tabler/icons-react';

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
        if (template?.type === BenchmarkType.WEIGHT) {
          return null;
        }

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

  // Fetch full template with templateRepMaxes for WEIGHT type
  useEffect(() => {
    if (template?.type === BenchmarkType.WEIGHT && template.id) {
      setLoadingTemplate(true);
      getBenchmarkTemplate(template.id)
        .then((response) => {
          setFullTemplate(response.data);
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
  }, [template]);

  const updateRepMaxValue = (templateRepMaxId: string, value: string | number) => {
    setRepMaxValues((prev) => ({
      ...prev,
      [templateRepMaxId]: value,
    }));
  };

  const handleSubmit = async (values: FormValues) => {
    if (!template) return;

    setLoading(true);
    try {
      // Build the request based on the benchmark type
      const data: CreateMyBenchmarkInput = {
        templateId: template.id,
        notes: values.notes || undefined,
      };

      // Add measurement based on type
      if (template.type === BenchmarkType.WEIGHT) {
        // Build repMaxes array from repMaxValues
        const repMaxes = Object.entries(repMaxValues)
          .filter(([_, value]) => value !== '' && value !== undefined)
          .map(([templateRepMaxId, weightKg]) => ({
            templateRepMaxId,
            weightKg: typeof weightKg === 'string' ? parseFloat(weightKg) : weightKg,
            recordedAt: parseDateStringToLocalDate(values.recordedAt),
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
        data.recordedAt = parseDateStringToLocalDate(values.recordedAt);

        switch (template.type) {
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

      await onCreate(data);
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
          {template.type === BenchmarkType.WEIGHT ? (
            <>
              {loadingTemplate ? (
                <Text size="sm" c="dimmed">Loading rep max options...</Text>
              ) : fullTemplate?.templateRepMaxes && fullTemplate.templateRepMaxes.length > 0 ? (
                <>
                  <Stack gap="md">
                    <Text size="sm" fw={500}>Enter your rep maxes (at least one required)</Text>
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
                type={template.type}
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
            <Button type="submit" loading={loading} disabled={!template}>
              Create Benchmark
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}