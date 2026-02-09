import { Modal, Button, Stack, Textarea, TextInput, Text, Badge, Group, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { ClientBenchmark, BenchmarkType, UpdateMyBenchmarkInput, BenchmarkTemplate, DistanceUnit } from '@ironlogic4/shared';
import { IconWeight, IconRun, IconClock } from '@tabler/icons-react';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, getBenchmarkAgeInDays, convertDistanceToMeters } from '../../utils/benchmarkUtils';
import { getBenchmarkTemplate } from '../../services/benchmarkApi';

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
  const [fullTemplate, setFullTemplate] = useState<BenchmarkTemplate | null>(null);
  const [repMaxValues, setRepMaxValues] = useState<Record<string, number | string>>({});
  const [timeSubMaxValues, setTimeSubMaxValues] = useState<Record<string, number | string>>({});
  const [distanceSubMaxValues, setDistanceSubMaxValues] = useState<Record<string, number | string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

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

        // Skip validation for WEIGHT, DISTANCE, and multi-distance TIME as we validate sub-maxes separately
        if (benchmark.type === BenchmarkType.WEIGHT ||
            benchmark.type === BenchmarkType.DISTANCE ||
            (benchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0)) {
          return null;
        }

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

  // Initialize form when benchmark changes
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
              recordedAt: benchmark.recordedAt ? formatDateForInput(benchmark.recordedAt) : formatDateForInput(new Date()),
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

  const handleSubmit = form.onSubmit(async (values) => {
    if (!benchmark) return;

    const data: UpdateMyBenchmarkInput = {
      recordedAt: new Date(values.recordedAt),
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
            recordedAt: new Date(values.recordedAt),
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
            recordedAt: new Date(values.recordedAt),
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
              recordedAt: new Date(values.recordedAt),
            };
          });
          data.distanceSubMaxes = distanceSubMaxes;
        } else {
          // Simple TIME benchmark with single timeSeconds
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

    await onUpdate(benchmark.id, data);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!benchmark) return null;

  const ageInDays = getBenchmarkAgeInDays(benchmark);
  const daysLeft = 14 - ageInDays;

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
                      size="lg"
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
                    size="lg"
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
                    size="lg"
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
              error={typeof form.errors.measurementValue === 'string' ? form.errors.measurementValue : undefined}
              required
            />
          )}

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