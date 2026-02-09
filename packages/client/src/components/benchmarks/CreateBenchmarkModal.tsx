import { Modal, Stack, TextInput, Textarea, Button, Group, NumberInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { BenchmarkType, DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, convertDistanceToMeters } from '../../utils/benchmarkUtils';
import { parseTimeString, validateTimeString, parseDateStringToLocalDate } from '../../utils/benchmarkFormatters';
import { getBenchmarkTemplate } from '../../services/benchmarkApi';
import { IconWeight, IconCalendar, IconRun, IconClock } from '@tabler/icons-react';

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
  const [timeSubMaxValues, setTimeSubMaxValues] = useState<Record<string, number | string>>({});
  const [distanceSubMaxValues, setDistanceSubMaxValues] = useState<Record<string, number | string>>({});
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
        // Skip validation for WEIGHT, DISTANCE, and multi-distance TIME as we'll validate sub-maxes separately
        if (template?.type === BenchmarkType.WEIGHT ||
            template?.type === BenchmarkType.DISTANCE ||
            (template?.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0)) {
          return null;
        }

        if (value === undefined || value === null || value === '') {
          return 'Measurement is required';
        }

        // Special validation for time format (simple TIME benchmarks only)
        if (template?.type === BenchmarkType.TIME) {
          if (typeof value === 'string' && !validateTimeString(value)) {
            return 'Invalid time format. Use MM:SS';
          }
        }

        return null;
      },
    },
  });

  // Fetch full template with sub-maxes for WEIGHT, DISTANCE, and TIME types
  useEffect(() => {
    if (template &&
        (template.type === BenchmarkType.WEIGHT ||
         template.type === BenchmarkType.DISTANCE ||
         template.type === BenchmarkType.TIME) &&
        template.id) {
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
      setTimeSubMaxValues({});
      setDistanceSubMaxValues({});
    }
  }, [template]);

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

  const handleSubmit = async (values: FormValues) => {
    if (!template) return;

    setLoading(true);

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
    } else if (template.type === BenchmarkType.DISTANCE) {
      // Build timeSubMaxes array from timeSubMaxValues
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
    } else if (template.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0) {
      // Build distanceSubMaxes array from distanceSubMaxValues
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
      // For other types (simple TIME, REPS, OTHER), use recordedAt from form
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

    // Only runs on success
    form.reset();
    setRepMaxValues({});
    setTimeSubMaxValues({});
    setDistanceSubMaxValues({});
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
          ) : template.type === BenchmarkType.DISTANCE ? (
            <>
              {loadingTemplate ? (
                <Text size="sm" c="dimmed">Loading distance intervals...</Text>
              ) : fullTemplate?.templateTimeSubMaxes && fullTemplate.templateTimeSubMaxes.length > 0 ? (
                <>
                  <Stack gap="md">
                    <Text size="sm" fw={500}>
                      Enter distances covered for each time interval in {fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 'kilometers' : 'meters'}
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

                  <TextInput
                    label="Date Recorded"
                    type="date"
                    {...form.getInputProps('recordedAt')}
                    required
                    max={formatDateForInput(new Date())}
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
                maxRows={6}
                description="Any context or details about this measurement"
              />
            </>
          ) : template.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0 ? (
            <>
              {loadingTemplate ? (
                <Text size="sm" c="dimmed">Loading distance intervals...</Text>
              ) : (
                <>
                  <Stack gap="md">
                    <Text size="sm" fw={500}>
                      Enter time taken for each distance interval (in seconds)
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

                  <TextInput
                    label="Date Recorded"
                    type="date"
                    {...form.getInputProps('recordedAt')}
                    required
                    max={formatDateForInput(new Date())}
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