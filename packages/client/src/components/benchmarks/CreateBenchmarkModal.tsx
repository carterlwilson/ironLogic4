import { Modal, Stack, TextInput, Textarea, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { BenchmarkType, DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { SubMaxInputGrid } from './SubMaxInputGrid';
import { formatDateForInput, convertDistanceToMeters } from '../../utils/benchmarkUtils';
import { parseTimeString, validateTimeString, parseDateStringToLocalDate } from '../../utils/benchmarkFormatters';
import { useBenchmarkTemplate } from '../../hooks/useBenchmarkTemplate';

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
  const [repMaxValues, setRepMaxValues] = useState<Record<string, number | string>>({});
  const [timeSubMaxValues, setTimeSubMaxValues] = useState<Record<string, number | string>>({});
  const [distanceSubMaxValues, setDistanceSubMaxValues] = useState<Record<string, number | string>>({});

  const needsFullTemplate = template?.type === BenchmarkType.WEIGHT ||
    template?.type === BenchmarkType.DISTANCE ||
    template?.type === BenchmarkType.TIME;
  const { data: fullTemplate, isLoading: loadingTemplate } = useBenchmarkTemplate(
    needsFullTemplate ? template?.id : null
  );

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

    try {
      await onCreate(data);
      form.reset();
      setRepMaxValues({});
      setTimeSubMaxValues({});
      setDistanceSubMaxValues({});
      onClose();
    } finally {
      setLoading(false);
    }
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

  const showSubMaxGrid =
    template.type === BenchmarkType.WEIGHT ||
    template.type === BenchmarkType.DISTANCE ||
    (template.type === BenchmarkType.TIME && !!fullTemplate?.templateDistanceSubMaxes?.length);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Create Benchmark: ${template.name}`}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {showSubMaxGrid ? (
            <SubMaxInputGrid
              benchmarkType={template.type}
              fullTemplate={fullTemplate}
              loadingTemplate={loadingTemplate}
              repMaxValues={repMaxValues}
              onRepMaxChange={updateRepMaxValue}
              timeSubMaxValues={timeSubMaxValues}
              onTimeSubMaxChange={updateTimeSubMaxValue}
              distanceSubMaxValues={distanceSubMaxValues}
              onDistanceSubMaxChange={updateDistanceSubMaxValue}
              error={form.errors.measurementValue as string | undefined}
            />
          ) : (
            <BenchmarkMeasurementInput
              type={template.type}
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
            <Button type="submit" loading={loading} disabled={!template}>
              Create Benchmark
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}