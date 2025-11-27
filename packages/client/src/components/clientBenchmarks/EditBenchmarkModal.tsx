import { Modal, Stack, Group, Button, NumberInput, TextInput, Textarea, SimpleGrid, Loader, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { parseTimeString, validateTimeString, formatTimeSeconds, parseDateStringToLocalDate } from '../../utils/benchmarkFormatters';
import { formatDateForInput } from '../../utils/benchmarkUtils';
import { getBenchmarkTemplate } from '../../services/benchmarkApi';
import { RepMaxEditCard } from './RepMaxEditCard';

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
  const [fullTemplate, setFullTemplate] = useState<BenchmarkTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [repMaxValues, setRepMaxValues] = useState<Record<string, { weightKg?: number | string; recordedAt?: string }>>({});

  const form = useForm<FormValues>({
    initialValues: {
      recordedAt: new Date(),
      notes: '',
    },
    validate: {
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
    const loadTemplateAndInitialize = async () => {
      if (benchmark) {
        // Fetch full template for WEIGHT type
        if (benchmark.type === BenchmarkType.WEIGHT) {
          setLoadingTemplate(true);
          try {
            const response = await getBenchmarkTemplate(benchmark.templateId);
            setFullTemplate(response.data);
          } catch (error) {
            console.error('Failed to load template details:', error);
            setFullTemplate(null);
          } finally {
            setLoadingTemplate(false);
          }

          // Initialize repMaxValues from existing benchmark data
          if (benchmark.repMaxes) {
            const initialValues: Record<string, { weightKg: number | string; recordedAt: string }> = {};
            benchmark.repMaxes.forEach(repMax => {
              initialValues[repMax.id] = {
                weightKg: repMax.weightKg,
                recordedAt: formatDateForInput(repMax.recordedAt),
              };
            });
            setRepMaxValues(initialValues);
          }
        } else {
          setFullTemplate(null);
        }

        // Get recordedAt - prefer recordedAt field, fallback to first repMax for WEIGHT type
        const recordedDate = benchmark.recordedAt || benchmark.repMaxes?.[0]?.recordedAt || new Date();

        const values: FormValues = {
          recordedAt: new Date(recordedDate),
          notes: benchmark.notes || '',
        };

        if (benchmark.type === BenchmarkType.TIME) {
          values.timeString = benchmark.timeSeconds ? formatTimeSeconds(benchmark.timeSeconds) : '';
        } else if (benchmark.type === BenchmarkType.REPS) {
          values.reps = benchmark.reps;
        } else if (benchmark.type === BenchmarkType.OTHER) {
          values.otherNotes = benchmark.otherNotes;
        }

        form.setValues(values);
      }
    };

    loadTemplateAndInitialize();
  }, [benchmark]);

  const updateRepMaxValue = (repMaxId: string, field: 'weightKg' | 'recordedAt', value: any) => {
    setRepMaxValues(prev => ({
      ...prev,
      [repMaxId]: {
        ...prev[repMaxId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (values: FormValues) => {
    if (!benchmark) return;

    const updatedBenchmark: ClientBenchmark = {
      ...benchmark,
      recordedAt: values.recordedAt,
      notes: values.notes,
    };

    // Update measurement based on type
    if (benchmark.type === BenchmarkType.WEIGHT) {
      // Build updated repMaxes array from modified values
      const updatedRepMaxes = benchmark.repMaxes?.map(repMax => {
        const changes = repMaxValues[repMax.id];
        if (changes) {
          return {
            ...repMax,
            weightKg: changes.weightKg !== undefined
              ? (typeof changes.weightKg === 'string' ? parseFloat(changes.weightKg) : changes.weightKg)
              : repMax.weightKg,
            recordedAt: changes.recordedAt ? parseDateStringToLocalDate(changes.recordedAt) : repMax.recordedAt,
            updatedAt: new Date(),
          };
        }
        return repMax;
      }) || [];

      updatedBenchmark.repMaxes = updatedRepMaxes;
      // Remove recordedAt from top-level since WEIGHT benchmarks use repMax dates
      delete updatedBenchmark.recordedAt;
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
          {benchmark.type === BenchmarkType.WEIGHT && fullTemplate?.templateRepMaxes && (
            <Stack gap="md">
              <Text size="sm" fw={500}>Rep Maxes</Text>

              {loadingTemplate ? (
                <Loader size="sm" />
              ) : (
                <SimpleGrid cols={1} spacing="sm">
                  {benchmark.repMaxes
                    ?.sort((a, b) => {
                      const aReps = fullTemplate.templateRepMaxes?.find(t => t.id === a.templateRepMaxId)?.reps || 999;
                      const bReps = fullTemplate.templateRepMaxes?.find(t => t.id === b.templateRepMaxId)?.reps || 999;
                      return aReps - bReps;
                    })
                    .map((repMax) => {
                      const templateRepMax = fullTemplate.templateRepMaxes?.find(t => t.id === repMax.templateRepMaxId);
                      if (!templateRepMax) return null;

                      const currentValues = repMaxValues[repMax.id] || {
                        weightKg: repMax.weightKg,
                        recordedAt: formatDateForInput(repMax.recordedAt),
                      };

                      return (
                        <RepMaxEditCard
                          key={repMax.id}
                          repMax={repMax}
                          templateRepMaxName={templateRepMax.name}
                          weightValue={currentValues.weightKg ?? repMax.weightKg}
                          dateValue={currentValues.recordedAt ?? formatDateForInput(repMax.recordedAt)}
                          onWeightChange={(value) => updateRepMaxValue(repMax.id, 'weightKg', value)}
                          onDateChange={(value) => updateRepMaxValue(repMax.id, 'recordedAt', value)}
                        />
                      );
                    })}
                </SimpleGrid>
              )}
            </Stack>
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

          {benchmark.type !== BenchmarkType.WEIGHT && (
            <DatePickerInput
              label="Recorded Date"
              placeholder="Select date"
              required
              {...form.getInputProps('recordedAt')}
            />
          )}

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