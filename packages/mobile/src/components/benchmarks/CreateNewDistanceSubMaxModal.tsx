import { Modal, Button, Stack, Textarea, TextInput, Text, Badge, Group, Paper, Divider, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ClientBenchmark, BenchmarkTemplate, CreateMyBenchmarkInput, DistanceSubMax } from '@ironlogic4/shared';
import { IconClock, IconCalendar } from '@tabler/icons-react';
import { formatDateForInput, formatDate, getDistanceSubMaxAgeInDays, parseDateStringToLocalDate, formatTimeSeconds } from '../../utils/benchmarkUtils';

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

    // Build distanceSubMaxes array: updated target + copied others
    const distanceSubMaxes = (oldBenchmark.distanceSubMaxes || []).map(dsm => {
      if (dsm.id === targetDistanceSubMax.id) {
        // This is the target distance sub-max - use new values
        return {
          templateDistanceSubMaxId: dsm.templateDistanceSubMaxId,
          timeSeconds: newTimeSeconds,
          recordedAt: recordedDate,
        };
      } else {
        // Copy existing distance sub-max values
        return {
          templateDistanceSubMaxId: dsm.templateDistanceSubMaxId,
          timeSeconds: dsm.timeSeconds,
          recordedAt: dsm.recordedAt, // Keep original date
        };
      }
    });

    const data: CreateMyBenchmarkInput = {
      templateId: oldBenchmark.templateId,
      oldBenchmarkId: oldBenchmark.id, // Triggers move to historical
      distanceSubMaxes,
      notes: values.notes || undefined,
    };

    await onCreate(data);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!oldBenchmark || !targetDistanceSubMax || !template) return null;

  const ageInDays = getDistanceSubMaxAgeInDays(targetDistanceSubMax);

  // Find template name for this distanceSubMax
  const templateDistanceSubMax = template.templateDistanceSubMaxes?.find(t => t.id === targetDistanceSubMax.templateDistanceSubMaxId);
  const templateDistanceSubMaxName = templateDistanceSubMax?.name || 'Unknown';

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create New from Historical"
      size="lg"
      fullScreen
    >
      <Stack gap="md">
        {/* Old Benchmark Reference */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600}>{oldBenchmark.name}</Text>
              <Badge color="gray" variant="light">
                Historical ({ageInDays} days old)
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{templateDistanceSubMaxName}</Text>
              <Text size="sm" fw={500}>
                {formatTimeSeconds(targetDistanceSubMax.timeSeconds)}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Recorded: {formatDate(targetDistanceSubMax.recordedAt)}
            </Text>
          </Stack>
        </Paper>

        <Divider label="New Benchmark Values" labelPosition="center" />

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
              Create New Benchmark
            </Button>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}
