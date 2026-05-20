import { Modal, Stack, TextInput, Textarea, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { BenchmarkType, DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import type { UpdateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { SubMaxInputGrid } from './SubMaxInputGrid';
import { formatDateForInput, convertDistanceToMeters } from '../../utils/benchmarkUtils';
import { parseTimeString, validateTimeString, parseDateStringToLocalDate } from '../../utils/benchmarkFormatters';
import { useBenchmarkTemplate } from '../../hooks/useBenchmarkTemplate';

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
  const [repMaxValues, setRepMaxValues] = useState<Record<string, number | string>>({});
  const [timeSubMaxValues, setTimeSubMaxValues] = useState<Record<string, number | string>>({});
  const [distanceSubMaxValues, setDistanceSubMaxValues] = useState<Record<string, number | string>>({});

  const needsFullTemplate = opened && (
    benchmark?.type === BenchmarkType.WEIGHT ||
    benchmark?.type === BenchmarkType.DISTANCE ||
    benchmark?.type === BenchmarkType.TIME
  );
  const { data: fullTemplate, isLoading: loadingTemplate } = useBenchmarkTemplate(
    needsFullTemplate ? benchmark?.templateId : null
  );

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

  useEffect(() => {
    if (!benchmark || !opened) return;

    if (needsFullTemplate && !fullTemplate) return;

    if (needsFullTemplate && fullTemplate) {
      if (benchmark.type === BenchmarkType.WEIGHT && benchmark.repMaxes) {
        const prefilled: Record<string, number> = {};
        benchmark.repMaxes.forEach((repMax) => {
          prefilled[repMax.templateRepMaxId] = repMax.weightKg;
        });
        setRepMaxValues(prefilled);
      } else if (benchmark.type === BenchmarkType.DISTANCE && benchmark.timeSubMaxes) {
        const prefilled: Record<string, number> = {};
        benchmark.timeSubMaxes.forEach((tsm) => {
          const distanceValue = fullTemplate.distanceUnit === DistanceUnit.KILOMETERS
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

      form.setValues({
        recordedAt: benchmark.recordedAt ? formatDateForInput(benchmark.recordedAt) :
                   benchmark.repMaxes?.[0]?.recordedAt ? formatDateForInput(benchmark.repMaxes[0].recordedAt) :
                   formatDateForInput(new Date()),
        notes: benchmark.notes || '',
        measurementValue: benchmark.type === BenchmarkType.TIME && !benchmark.distanceSubMaxes ? benchmark.timeSeconds : undefined,
      });
    } else {
      const measurementValue =
        benchmark.type === BenchmarkType.REPS ? benchmark.reps :
        benchmark.otherNotes;

      form.setValues({
        recordedAt: benchmark.recordedAt ? formatDateForInput(benchmark.recordedAt) : formatDateForInput(new Date()),
        notes: benchmark.notes || '',
        measurementValue,
      });

      setRepMaxValues({});
      setTimeSubMaxValues({});
      setDistanceSubMaxValues({});
    }
  }, [benchmark, opened, fullTemplate, needsFullTemplate]);

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
          {benchmark.type === BenchmarkType.WEIGHT ||
           benchmark.type === BenchmarkType.DISTANCE ||
           (benchmark.type === BenchmarkType.TIME && (loadingTemplate || !!fullTemplate?.templateDistanceSubMaxes?.length)) ? (
            <SubMaxInputGrid
              benchmarkType={benchmark.type}
              fullTemplate={fullTemplate}
              loadingTemplate={loadingTemplate}
              repMaxValues={repMaxValues}
              onRepMaxChange={updateRepMaxValue}
              timeSubMaxValues={timeSubMaxValues}
              onTimeSubMaxChange={updateTimeSubMaxValue}
              distanceSubMaxValues={distanceSubMaxValues}
              onDistanceSubMaxChange={updateDistanceSubMaxValue}
            />
          ) : (
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