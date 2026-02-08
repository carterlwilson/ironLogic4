import { Modal, Button, Stack, Textarea, TextInput, Text, Badge, Group, Paper, Divider, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { ClientBenchmark, BenchmarkType, CreateMyBenchmarkInput, BenchmarkTemplate, DistanceUnit } from '@ironlogic4/shared';
import { IconWeight, IconCalendar, IconRun, IconClock } from '@tabler/icons-react';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, formatMeasurement, formatDate, getBenchmarkAgeInDays, parseDateStringToLocalDate, convertDistanceToMeters } from '../../utils/benchmarkUtils';
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
  const [timeSubMaxValues, setTimeSubMaxValues] = useState<Record<string, number | string>>({});
  const [distanceSubMaxValues, setDistanceSubMaxValues] = useState<Record<string, number | string>>({});
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

        // Skip validation for WEIGHT, DISTANCE, and multi-distance TIME
        if (oldBenchmark.type === BenchmarkType.WEIGHT ||
            oldBenchmark.type === BenchmarkType.DISTANCE ||
            (oldBenchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0)) {
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

      // For WEIGHT, DISTANCE, or TIME with sub-maxes, fetch template and pre-fill
      if (oldBenchmark.type === BenchmarkType.WEIGHT ||
          oldBenchmark.type === BenchmarkType.DISTANCE ||
          oldBenchmark.type === BenchmarkType.TIME) {

        setLoadingTemplate(true);
        getBenchmarkTemplate(oldBenchmark.templateId)
          .then((response) => {
            setFullTemplate(response.data);

            // Pre-fill based on type
            if (oldBenchmark.type === BenchmarkType.WEIGHT && oldBenchmark.repMaxes) {
              const prefilled: Record<string, number> = {};
              oldBenchmark.repMaxes.forEach((repMax) => {
                prefilled[repMax.templateRepMaxId] = repMax.weightKg;
              });
              setRepMaxValues(prefilled);
            } else if (oldBenchmark.type === BenchmarkType.DISTANCE && oldBenchmark.timeSubMaxes) {
              const prefilled: Record<string, number> = {};
              oldBenchmark.timeSubMaxes.forEach((tsm) => {
                // Convert from meters to display unit
                const distanceValue = response.data.distanceUnit === DistanceUnit.KILOMETERS
                  ? tsm.distanceMeters / 1000
                  : tsm.distanceMeters;
                prefilled[tsm.templateSubMaxId] = distanceValue;
              });
              setTimeSubMaxValues(prefilled);
            } else if (oldBenchmark.type === BenchmarkType.TIME && oldBenchmark.distanceSubMaxes) {
              const prefilled: Record<string, number> = {};
              oldBenchmark.distanceSubMaxes.forEach((dsm) => {
                prefilled[dsm.templateDistanceSubMaxId] = dsm.timeSeconds;
              });
              setDistanceSubMaxValues(prefilled);
            }
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
        setTimeSubMaxValues({});
        setDistanceSubMaxValues({});
      }
    }
  }, [opened, oldBenchmark]);

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
    } else if (oldBenchmark.type === BenchmarkType.DISTANCE) {
      const timeSubMaxes = fullTemplate?.templateTimeSubMaxes?.map(tsm => {
        const value = timeSubMaxValues[tsm.id];
        const distanceValue = value && value !== ''
          ? (typeof value === 'string' ? parseFloat(value) : value)
          : 0;

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
    } else if (oldBenchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0) {
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
      // For non-sub-max types, use recordedAt from form
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

          {/* New Benchmark Form for DISTANCE type */}
          {oldBenchmark.type === BenchmarkType.DISTANCE && (
            <>
              {loadingTemplate ? (
                <Text size="sm" c="dimmed">Loading distance intervals...</Text>
              ) : fullTemplate?.templateTimeSubMaxes && fullTemplate.templateTimeSubMaxes.length > 0 ? (
                <>
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

                  <TextInput
                    label="Date Recorded"
                    type="date"
                    {...form.getInputProps('recordedAt')}
                    required
                    max={formatDateForInput(new Date())}
                    size="lg"
                    leftSection={<IconCalendar size={16} />}
                    description="When did you achieve these distances?"
                  />
                </>
              ) : (
                <Text size="sm" c="red">No time intervals available for this template</Text>
              )}

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

          {/* New Benchmark Form for TIME type with multiple distances */}
          {oldBenchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0 && (
            <>
              {loadingTemplate ? (
                <Text size="sm" c="dimmed">Loading distance intervals...</Text>
              ) : (
                <>
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

                  <TextInput
                    label="Date Recorded"
                    type="date"
                    {...form.getInputProps('recordedAt')}
                    required
                    max={formatDateForInput(new Date())}
                    size="lg"
                    leftSection={<IconCalendar size={16} />}
                    description="When did you achieve these times?"
                  />
                </>
              )}

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

          {/* New Benchmark Form for non-sub-max types (REPS, OTHER, simple TIME) */}
          {oldBenchmark.type !== BenchmarkType.WEIGHT &&
           oldBenchmark.type !== BenchmarkType.DISTANCE &&
           !(oldBenchmark.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0) && (
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