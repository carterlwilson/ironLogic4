import { Modal, Stack, Group, Button, NumberInput, TextInput, Textarea, SimpleGrid, Loader, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { BenchmarkType, DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
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
  const [timeSubMaxValues, setTimeSubMaxValues] = useState<Record<string, number | string>>({});
  const [distanceSubMaxValues, setDistanceSubMaxValues] = useState<Record<string, number | string>>({});

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
        // Fetch full template for WEIGHT, DISTANCE, and TIME types
        if (benchmark.type === BenchmarkType.WEIGHT ||
            benchmark.type === BenchmarkType.DISTANCE ||
            benchmark.type === BenchmarkType.TIME) {
          setLoadingTemplate(true);
          try {
            const response = await getBenchmarkTemplate(benchmark.templateId);
            setFullTemplate(response.data);

            // Initialize type-specific values from existing benchmark data
            if (benchmark.type === BenchmarkType.WEIGHT && benchmark.repMaxes) {
              const initialValues: Record<string, { weightKg: number | string; recordedAt: string }> = {};
              benchmark.repMaxes.forEach(repMax => {
                initialValues[repMax.id] = {
                  weightKg: repMax.weightKg,
                  recordedAt: formatDateForInput(repMax.recordedAt),
                };
              });
              setRepMaxValues(initialValues);
            } else if (benchmark.type === BenchmarkType.DISTANCE && benchmark.timeSubMaxes) {
              // Pre-fill timeSubMaxes for DISTANCE type
              const prefilled: Record<string, number> = {};
              benchmark.timeSubMaxes.forEach((tsm) => {
                const distanceValue = response.data.distanceUnit === DistanceUnit.KILOMETERS
                  ? tsm.distanceMeters / 1000
                  : tsm.distanceMeters;
                prefilled[tsm.templateSubMaxId] = distanceValue;
              });
              setTimeSubMaxValues(prefilled);
            } else if (benchmark.type === BenchmarkType.TIME && benchmark.distanceSubMaxes) {
              // Pre-fill distanceSubMaxes for TIME type
              const prefilled: Record<string, number> = {};
              benchmark.distanceSubMaxes.forEach((dsm) => {
                prefilled[dsm.templateDistanceSubMaxId] = dsm.timeSeconds;
              });
              setDistanceSubMaxValues(prefilled);
            }
          } catch (error) {
            console.error('Failed to load template details:', error);
            setFullTemplate(null);
          } finally {
            setLoadingTemplate(false);
          }
        } else {
          setFullTemplate(null);
        }

        // Get recordedAt from appropriate source based on type
        let recordedDate: Date;
        if (benchmark.recordedAt) {
          recordedDate = new Date(benchmark.recordedAt);
        } else if (benchmark.repMaxes?.[0]?.recordedAt) {
          recordedDate = new Date(benchmark.repMaxes[0].recordedAt);
        } else if (benchmark.timeSubMaxes?.[0]?.recordedAt) {
          recordedDate = new Date(benchmark.timeSubMaxes[0].recordedAt);
        } else if (benchmark.distanceSubMaxes?.[0]?.recordedAt) {
          recordedDate = new Date(benchmark.distanceSubMaxes[0].recordedAt);
        } else {
          recordedDate = new Date();
        }

        const values: FormValues = {
          recordedAt: recordedDate,
          notes: benchmark.notes || '',
        };

        if (benchmark.type === BenchmarkType.TIME && benchmark.timeSeconds) {
          values.timeString = formatTimeSeconds(benchmark.timeSeconds);
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

  const updateTimeSubMaxValue = (templateSubMaxId: string, value: string | number) => {
    setTimeSubMaxValues((prev) => ({
      ...prev,
      [templateSubMaxId]: value,
    }));
  };

  const updateDistanceSubMaxValue = (templateDistanceSubMaxId: string, value: string | number) => {
    setDistanceSubMaxValues((prev) => ({
      ...prev,
      [templateDistanceSubMaxId]: value,
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
    } else if (benchmark.type === BenchmarkType.DISTANCE && fullTemplate?.templateTimeSubMaxes) {
      // Build updated timeSubMaxes array for DISTANCE type
      const updatedTimeSubMaxes = benchmark.timeSubMaxes?.map(tsm => {
        const newValue = timeSubMaxValues[tsm.templateSubMaxId];
        if (newValue !== undefined) {
          // Convert display value to meters
          const distanceMeters = fullTemplate.distanceUnit === DistanceUnit.KILOMETERS
            ? (typeof newValue === 'string' ? parseFloat(newValue) : newValue) * 1000
            : (typeof newValue === 'string' ? parseFloat(newValue) : newValue);

          return {
            ...tsm,
            distanceMeters,
            updatedAt: new Date(),
          };
        }
        return tsm;
      }) || [];

      updatedBenchmark.timeSubMaxes = updatedTimeSubMaxes;
      // Remove recordedAt from top-level since DISTANCE benchmarks use timeSubMax dates
      delete updatedBenchmark.recordedAt;
    } else if (benchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes) {
      // Build updated distanceSubMaxes array for TIME type
      const updatedDistanceSubMaxes = benchmark.distanceSubMaxes?.map(dsm => {
        const newValue = distanceSubMaxValues[dsm.templateDistanceSubMaxId];
        if (newValue !== undefined) {
          const timeSeconds = typeof newValue === 'string' ? parseFloat(newValue) : newValue;

          return {
            ...dsm,
            timeSeconds,
            updatedAt: new Date(),
          };
        }
        return dsm;
      }) || [];

      updatedBenchmark.distanceSubMaxes = updatedDistanceSubMaxes;
      // Remove recordedAt from top-level since TIME benchmarks use distanceSubMax dates
      delete updatedBenchmark.recordedAt;
    } else if (benchmark.type === BenchmarkType.TIME && values.timeString) {
      // Old-style TIME benchmark with single timeSeconds value
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

          {benchmark.type === BenchmarkType.DISTANCE && fullTemplate?.templateTimeSubMaxes && (
            <Stack gap="md">
              <Text size="sm" fw={500}>Update your distances</Text>

              {loadingTemplate ? (
                <Loader size="sm" />
              ) : fullTemplate.templateTimeSubMaxes.length > 0 ? (
                <SimpleGrid cols={1} spacing="sm">
                  {fullTemplate.templateTimeSubMaxes.map((tsm) => (
                    <NumberInput
                      key={tsm.id}
                      label={tsm.name}
                      placeholder="Enter distance"
                      value={timeSubMaxValues[tsm.id] || ''}
                      onChange={(val) => updateTimeSubMaxValue(tsm.id, val)}
                      min={0}
                      decimalScale={fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 2 : 0}
                      step={fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 0.1 : 10}
                      suffix={` ${fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 'km' : 'm'}`}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Text size="sm" c="red">No distance options available for this template</Text>
              )}
            </Stack>
          )}

          {benchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && (
            <Stack gap="md">
              <Text size="sm" fw={500}>Update your times</Text>

              {loadingTemplate ? (
                <Loader size="sm" />
              ) : fullTemplate.templateDistanceSubMaxes.length > 0 ? (
                <SimpleGrid cols={1} spacing="sm">
                  {fullTemplate.templateDistanceSubMaxes.map((dsm) => (
                    <NumberInput
                      key={dsm.id}
                      label={dsm.name}
                      placeholder="Enter time"
                      value={distanceSubMaxValues[dsm.id] || ''}
                      onChange={(val) => updateDistanceSubMaxValue(dsm.id, val)}
                      min={0}
                      decimalScale={1}
                      step={0.1}
                      suffix=" s"
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Text size="sm" c="red">No time options available for this template</Text>
              )}
            </Stack>
          )}

          {benchmark.type === BenchmarkType.TIME && !fullTemplate?.templateDistanceSubMaxes && (
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

          {benchmark.type !== BenchmarkType.WEIGHT &&
           !(benchmark.type === BenchmarkType.DISTANCE && fullTemplate?.templateTimeSubMaxes) &&
           !(benchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes) && (
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