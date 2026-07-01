import { Modal, Button, Stack, Textarea, TextInput, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ClientBenchmark, BenchmarkTemplate, CreateMyBenchmarkInput, DistanceSubMax } from '@ironlogic4/shared';
import { IconClock, IconCalendar } from '@tabler/icons-react';
import { formatDateForInput, parseDateStringToLocalDate } from '../../utils/benchmarkUtils';

interface CreateNewDistanceSubMaxModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (data: CreateMyBenchmarkInput) => Promise<void>;
  oldBenchmark: ClientBenchmark | null;
  targetDistanceSubMax: DistanceSubMax | null;
  template: BenchmarkTemplate | null;
  loading: boolean;
}

export function CreateNewDistanceSubMaxModal({
  opened,
  onClose,
  onCreate,
  oldBenchmark,
  targetDistanceSubMax,
  template,
  loading,
}: CreateNewDistanceSubMaxModalProps) {
  const form = useForm<{
    recordedAt: string;
    notes: string;
    timeSeconds: number | string;
  }>({
    initialValues: {
      recordedAt: formatDateForInput(new Date()),
      notes: '',
      timeSeconds: '',
    },
    validate: {
      recordedAt: (value) => (!value ? 'Please select a date' : null),
      timeSeconds: (value) => {
        if (value === '' || value === undefined) return 'Please enter a time';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue <= 0) return 'Please enter a valid time';
        return null;
      },
    },
  });

  // Pre-fill form when modal opens
  useEffect(() => {
    if (opened && targetDistanceSubMax) {
      form.reset();
      form.setFieldValue('recordedAt', formatDateForInput(new Date()));
      form.setFieldValue('timeSeconds', targetDistanceSubMax.timeSeconds);
      form.setFieldValue('notes', '');
    }
  }, [opened, targetDistanceSubMax]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!oldBenchmark || !targetDistanceSubMax || !template) return;

    const recordedDate = parseDateStringToLocalDate(values.recordedAt);
    const newTimeSeconds = typeof values.timeSeconds === 'string' ? parseFloat(values.timeSeconds) : values.timeSeconds;

    const data: CreateMyBenchmarkInput = {
      templateId: oldBenchmark.templateId,
      distanceSubMaxes: [{
        templateDistanceSubMaxId: targetDistanceSubMax.templateDistanceSubMaxId,
        timeSeconds: newTimeSeconds,
        recordedAt: recordedDate,
      }],
      notes: values.notes || undefined,
    };

    await onCreate(data);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!oldBenchmark || !targetDistanceSubMax || !template) return null;

  // Find template name for this distanceSubMax
  const templateDistanceSubMax = template.templateDistanceSubMaxes?.find(t => t.id === targetDistanceSubMax.templateDistanceSubMaxId);
  const templateDistanceSubMaxName = templateDistanceSubMax?.name || 'Unknown';

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Update Time"
      size="lg"
      fullScreen
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <NumberInput
            label="Time"
            placeholder="Enter time in seconds"
            value={form.values.timeSeconds}
            onChange={(value) => form.setFieldValue('timeSeconds', value)}
            error={form.errors.timeSeconds}
            required
            min={0}
            step={0.1}
            decimalScale={1}
            size="lg"
            leftSection={<IconClock size={18} />}
            description={`Time to complete ${templateDistanceSubMaxName}`}
          />

          <TextInput
            label="Date Recorded"
            type="date"
            {...form.getInputProps('recordedAt')}
            required
            size="lg"
            max={formatDateForInput(new Date())}
            leftSection={<IconCalendar size={18} />}
            description="When did you achieve this time?"
          />

          <Textarea
            label="Notes (Optional)"
            placeholder="Add any notes about this benchmark..."
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
