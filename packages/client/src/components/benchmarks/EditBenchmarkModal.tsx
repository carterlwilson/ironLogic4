import { Modal, Stack, TextInput, Textarea, Button, Group, NumberInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { BenchmarkType, DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import type { UpdateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, convertDistanceToMeters } from '../../utils/benchmarkUtils';
import { parseTimeString, validateTimeString, parseDateStringToLocalDate } from '../../utils/benchmarkFormatters';
import { getBenchmarkTemplate } from '../../services/benchmarkApi';
import { IconWeight, IconRun, IconClock } from '@tabler/icons-react';

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
  const [fullTemplate, setFullTemplate] = useState<BenchmarkTemplate | null>(null);
  const [repMaxValues, setRepMaxValues] = useState<Record<string, number | string>>({});
  const [timeSubMaxValues, setTimeSubMaxValues] = useState<Record<string, number | string>>({});
  const [distanceSubMaxValues, setDistanceSubMaxValues] = useState<Record<string, number | string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const updateRepMaxValue = (templateRepMaxId: string, value: string | number) => {
    setRepMaxValues((prev) => ({
      ...prev,
      [templateRepMaxId]: value,
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

  const form = useForm<FormValues>({
    initialValues: {
      recordedAt: '',
      notes: '',
      measurementValue: undefined,
    },
    validate: {
      recordedAt: (value) => (!value ? 'Date is required' : null),
      measurementValue: (value) => {
        if (!benchmark) return null;

        // Skip validation for WEIGHT, DISTANCE, and multi-distance TIME as we validate sub-maxes separately
        if (benchmark.type === BenchmarkType.WEIGHT ||
            benchmark.type === BenchmarkType.DISTANCE ||
            (benchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0)) {
          return null;
        }

        if (value === undefined || value === null || value === '') {
          return 'Measurement is required';
        }

        // Special validation for time format (simple TIME benchmarks only)
        if (benchmark.type === BenchmarkType.TIME) {
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
    if (benchmark && opened) {
      // Handle WEIGHT, DISTANCE, and TIME types - always fetch template to check for sub-maxes
      if (benchmark.type === BenchmarkType.WEIGHT ||
          benchmark.type === BenchmarkType.DISTANCE ||
          benchmark.type === BenchmarkType.TIME) {

        setLoadingTemplate(true);
        getBenchmarkTemplate(benchmark.templateId)
          .then((response) => {
            setFullTemplate(response.data);

            // Pre-fill based on type
            if (benchmark.type === BenchmarkType.WEIGHT && benchmark.repMaxes) {
              const prefilled: Record<string, number> = {};
              benchmark.repMaxes.forEach((repMax) => {
                prefilled[repMax.templateRepMaxId] = repMax.weightKg;
              });
              setRepMaxValues(prefilled);
            } else if (benchmark.type === BenchmarkType.DISTANCE && benchmark.timeSubMaxes) {
              const prefilled: Record<string, number> = {};
              benchmark.timeSubMaxes.forEach((tsm) => {
                // Convert from meters to display unit if needed
                const distanceValue = response.data.distanceUnit === DistanceUnit.KILOMETERS
                  ? tsm.distanceMeters / 1000
                  : tsm.distanceMeters;
                prefilled[tsm.templateSubMaxId] = distanceValue;
              });
              setTimeSubMaxValues(prefilled);
            } else if (benchmark.type === BenchmarkType.TIME && benchmark.distanceSubMaxes) {
              const prefilled: Record<string, number> = {};
              benchmark.distanceSubMaxes.forEach((dsm) => {
                prefilled[dsm.templateDistanceSubMaxId] = dsm.timeSeconds;
              });
              setDistanceSubMaxValues(prefilled);
            }

            // Set form values - for simple TIME benchmarks, include timeSeconds
            form.setValues({
              recordedAt: benchmark.recordedAt ? formatDateForInput(benchmark.recordedAt) :
                         benchmark.repMaxes?.[0]?.recordedAt ? formatDateForInput(benchmark.repMaxes[0].recordedAt) :
                         formatDateForInput(new Date()),
              notes: benchmark.notes || '',
              measurementValue: benchmark.type === BenchmarkType.TIME && !benchmark.distanceSubMaxes ? benchmark.timeSeconds : undefined,
            });
          })
          .catch((error) => {
            console.error('Failed to load template details:', error);
          })
          .finally(() => {
            setLoadingTemplate(false);
          });
      } else {
        // REPS and OTHER types - simple logic
        const measurementValue =
          benchmark.type === BenchmarkType.REPS ? benchmark.reps :
          benchmark.otherNotes;

        form.setValues({
          recordedAt: benchmark.recordedAt ? formatDateForInput(benchmark.recordedAt) : formatDateForInput(new Date()),
          notes: benchmark.notes || '',
          measurementValue,
        });

        // Clear template state
        setFullTemplate(null);
        setRepMaxValues({});
        setTimeSubMaxValues({});
        setDistanceSubMaxValues({});
      }
    }
  }, [benchmark, opened]);

  const handleSubmit = async (values: FormValues) => {
    if (!benchmark) return;

    setLoading(true);

    // Build the update request
    const data: UpdateMyBenchmarkInput = {
      recordedAt: parseDateStringToLocalDate(values.recordedAt),
      notes: values.notes || undefined,
    };

    // Add measurement based on type
    switch (benchmark.type) {
      case BenchmarkType.WEIGHT:
        // Build repMaxes from the form state
        const repMaxes = fullTemplate?.templateRepMaxes?.map(trm => {
          const value = repMaxValues[trm.id];
          return {
            templateRepMaxId: trm.id,
            weightKg: value && value !== ''
              ? (typeof value === 'string' ? parseFloat(value) : value)
              : 0,
            recordedAt: parseDateStringToLocalDate(values.recordedAt),
          };
        }) || [];
        data.repMaxes = repMaxes;
        break;

      case BenchmarkType.DISTANCE:
        // Build timeSubMaxes from the form state
        const timeSubMaxes = fullTemplate?.templateTimeSubMaxes?.map(tsm => {
          const value = timeSubMaxValues[tsm.id];
          const distanceValue = value && value !== ''
            ? (typeof value === 'string' ? parseFloat(value) : value)
            : 0;

          // Convert to meters if template uses kilometers
          const distanceMeters = fullTemplate.distanceUnit === DistanceUnit.KILOMETERS
            ? convertDistanceToMeters(distanceValue, DistanceUnit.KILOMETERS)
            : distanceValue;

          return {
            templateSubMaxId: tsm.id,
            distanceMeters,
            recordedAt: parseDateStringToLocalDate(values.recordedAt),
          };
        }) || [];
        data.timeSubMaxes = timeSubMaxes;
        break;

      case BenchmarkType.TIME:
        // Check if this is a multi-distance TIME benchmark
        if (fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0) {
          const distanceSubMaxes = fullTemplate.templateDistanceSubMaxes.map(dsm => {
            const value = distanceSubMaxValues[dsm.id];
            const timeValue = value && value !== ''
              ? (typeof value === 'string' ? parseFloat(value) : value)
              : 0;

            return {
              templateDistanceSubMaxId: dsm.id,
              timeSeconds: timeValue,
              recordedAt: parseDateStringToLocalDate(values.recordedAt),
            };
          });
          data.distanceSubMaxes = distanceSubMaxes;
        } else {
          // Simple TIME benchmark with single timeSeconds
          if (typeof values.measurementValue === 'string') {
            data.timeSeconds = parseTimeString(values.measurementValue);
          } else {
            data.timeSeconds = values.measurementValue as number;
          }
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

    // Only runs on success
    form.reset();
    onClose();
    setLoading(false);
  };

  const handleClose = () => {
    form.reset();
    setRepMaxValues({});
    setTimeSubMaxValues({});
    setDistanceSubMaxValues({});
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
          {/* WEIGHT type - show rep max inputs */}
          {benchmark.type === BenchmarkType.WEIGHT ? (
            loadingTemplate ? (
              <Text size="sm" c="dimmed">Loading rep max options...</Text>
            ) : fullTemplate?.templateRepMaxes && fullTemplate.templateRepMaxes.length > 0 ? (
              <Stack gap="md">
                <Text size="sm" fw={500}>Update your rep maxes</Text>
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
              </Stack>
            ) : (
              <Text size="sm" c="red">No rep max options available for this template</Text>
            )
          ) : benchmark.type === BenchmarkType.DISTANCE ? (
            // DISTANCE type - show time interval inputs
            loadingTemplate ? (
              <Text size="sm" c="dimmed">Loading distance intervals...</Text>
            ) : fullTemplate?.templateTimeSubMaxes && fullTemplate.templateTimeSubMaxes.length > 0 ? (
              <Stack gap="md">
                <Text size="sm" fw={500}>
                  Update distances covered for each time interval in {fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 'kilometers' : 'meters'}
                </Text>
                {fullTemplate.templateTimeSubMaxes.map((tsm) => (
                  <NumberInput
                    key={tsm.id}
                    label={tsm.name}
                    placeholder={`Distance in ${fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 'km' : 'm'}`}
                    value={timeSubMaxValues[tsm.id] || ''}
                    onChange={(val) => updateTimeSubMaxValue(tsm.id, val)}
                    min={0}
                    step={fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 0.1 : 10}
                    decimalScale={fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 2 : 0}
                    leftSection={<IconRun size={16} />}
                    description={`Distance covered in ${tsm.name}`}
                  />
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="red">No time intervals available for this template</Text>
            )
          ) : benchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0 ? (
            // TIME type with multiple distances - show distance interval inputs
            loadingTemplate ? (
              <Text size="sm" c="dimmed">Loading distance intervals...</Text>
            ) : (
              <Stack gap="md">
                <Text size="sm" fw={500}>
                  Update time taken for each distance interval (in seconds)
                </Text>
                {fullTemplate.templateDistanceSubMaxes.map((dsm) => (
                  <NumberInput
                    key={dsm.id}
                    label={dsm.name}
                    placeholder="Time in seconds"
                    value={distanceSubMaxValues[dsm.id] || ''}
                    onChange={(val) => updateDistanceSubMaxValue(dsm.id, val)}
                    min={0}
                    step={1}
                    decimalScale={1}
                    leftSection={<IconClock size={16} />}
                    description={`Time to complete ${dsm.name}`}
                  />
                ))}
              </Stack>
            )
          ) : (
            // Non-sub-max types - existing input
            <BenchmarkMeasurementInput
              type={benchmark.type}
              value={form.values.measurementValue}
              onChange={(value) => form.setFieldValue('measurementValue', value)}
              error={form.errors.measurementValue as string | undefined}
              required
            />
          )}

          <TextInput
            label="Date Recorded"
            type="date"
            required
            {...form.getInputProps('recordedAt')}
            max={formatDateForInput(new Date())}
          />

          <Textarea
            label="Notes (Optional)"
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