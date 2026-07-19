import { Modal, Button, Stack, Textarea, TextInput, Text, Badge, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ClientBenchmark, BenchmarkType, CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, parseDateStringToLocalDate, parseTimeString } from '../../utils/benchmarkUtils';

interface EditBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (data: CreateMyBenchmarkInput) => Promise<void>;
  benchmark: ClientBenchmark | null;
  loading: boolean;
}

export function EditBenchmarkModal({ opened, onClose, onCreate, benchmark, loading }: EditBenchmarkModalProps) {
  const form = useForm<{
    recordedAt: string;
    notes: string;
    measurementValue: number | string | undefined;
  }>({
    initialValues: { recordedAt: '', notes: '', measurementValue: undefined },
    validate: {
      recordedAt: (value) => (!value ? 'Please select a date' : null),
      measurementValue: (value) => {
        if (!benchmark) return null;
        if (benchmark.type === BenchmarkType.OTHER) return !value ? 'Please enter measurement notes' : null;
        if (benchmark.type === BenchmarkType.TIME) {
          if (!value) return 'Please enter a time value';
          if (typeof value === 'string' && !value.match(/^\d{2}:\d{2}$/)) return 'Invalid time format. Use MM:SS';
          return null;
        }
        return value === undefined || value === '' ? 'Please enter a measurement value' : null;
      },
    },
  });

  useEffect(() => {
    if (benchmark && opened) {
      const measurementValue =
        benchmark.type === BenchmarkType.REPS ? benchmark.reps :
        benchmark.type === BenchmarkType.TIME ? benchmark.timeSeconds :
        benchmark.otherNotes;
      form.setValues({
        recordedAt: benchmark.recordedAt ? formatDateForInput(benchmark.recordedAt) : formatDateForInput(new Date()),
        notes: benchmark.notes || '',
        measurementValue,
      });
    }
  }, [benchmark, opened]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!benchmark) return;
    const data: CreateMyBenchmarkInput = {
      templateId: benchmark.templateId,
      notes: values.notes || undefined,
      recordedAt: parseDateStringToLocalDate(values.recordedAt),
    };
    switch (benchmark.type) {
      case BenchmarkType.TIME:
        data.timeSeconds = typeof values.measurementValue === 'string'
          ? parseTimeString(values.measurementValue)
          : (values.measurementValue as number);
        break;
      case BenchmarkType.REPS:
        data.reps = values.measurementValue as number;
        break;
      case BenchmarkType.OTHER:
        data.otherNotes = values.measurementValue as string;
        break;
    }
    await onCreate(data);
  });

  const handleClose = () => { form.reset(); onClose(); };

  if (!benchmark) return null;

  return (
    <Modal opened={opened} onClose={handleClose} title="Update Benchmark" size="lg" fullScreen>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group justify="space-between" mb="xs">
            <Text fw={600} size="lg">{benchmark.name}</Text>
            <Badge color="forestGreen" variant="light" size="lg">{benchmark.type}</Badge>
          </Group>

          <BenchmarkMeasurementInput
            type={benchmark.type}
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
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
