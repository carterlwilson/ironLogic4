import { Modal, Button, Stack, Textarea, TextInput, Text, Badge, Group, Paper, Divider, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ClientBenchmark, BenchmarkTemplate, CreateMyBenchmarkInput, TimeSubMax } from '@ironlogic4/shared';
import { IconRun, IconCalendar } from '@tabler/icons-react';
import { formatDateForInput, formatDate, getTimeSubMaxAgeInDays, parseDateStringToLocalDate, convertDistanceToMeters } from '../../utils/benchmarkUtils';
import { DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';

interface CreateNewTimeSubMaxModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (data: CreateMyBenchmarkInput) => Promise<void>;
  oldBenchmark: ClientBenchmark | null;
  targetTimeSubMax: TimeSubMax | null;
  template: BenchmarkTemplate | null;
  loading: boolean;
}

export function CreateNewTimeSubMaxModal({
  opened,
  onClose,
  onCreate,
  oldBenchmark,
  targetTimeSubMax,
  template,
  loading,
}: CreateNewTimeSubMaxModalProps) {
  const form = useForm<{
    recordedAt: string;
    notes: string;
    distanceValue: number | string;
  }>({
    initialValues: {
      recordedAt: formatDateForInput(new Date()),
      notes: '',
      distanceValue: '',
    },
    validate: {
      recordedAt: (value) => (!value ? 'Please select a date' : null),
      distanceValue: (value) => {
        if (value === '' || value === undefined) return 'Please enter a distance';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue < 0) return 'Please enter a valid distance';
        return null;
      },
    },
  });

  // Pre-fill form when modal opens
  useEffect(() => {
    if (opened && targetTimeSubMax && template) {
      form.reset();
      form.setFieldValue('recordedAt', formatDateForInput(new Date()));

      // Convert meters to display unit
      const displayValue = template.distanceUnit === DistanceUnit.KILOMETERS
        ? targetTimeSubMax.distanceMeters / 1000
        : targetTimeSubMax.distanceMeters;

      form.setFieldValue('distanceValue', displayValue);
      form.setFieldValue('notes', '');
    }
  }, [opened, targetTimeSubMax, template]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!oldBenchmark || !targetTimeSubMax || !template) return;

    const recordedDate = parseDateStringToLocalDate(values.recordedAt);

    // Convert display value back to meters
    const newDistanceMeters = template.distanceUnit === DistanceUnit.KILOMETERS
      ? convertDistanceToMeters(
          typeof values.distanceValue === 'string' ? parseFloat(values.distanceValue) : values.distanceValue,
          DistanceUnit.KILOMETERS
        )
      : (typeof values.distanceValue === 'string' ? parseFloat(values.distanceValue) : values.distanceValue);

    // Build timeSubMaxes array: updated target + copied others
    const timeSubMaxes = (oldBenchmark.timeSubMaxes || []).map(tsm => {
      if (tsm.id === targetTimeSubMax.id) {
        // This is the target time sub-max - use new values
        return {
          templateSubMaxId: tsm.templateSubMaxId,
          distanceMeters: newDistanceMeters,
          recordedAt: recordedDate,
        };
      } else {
        // Copy existing time sub-max values
        return {
          templateSubMaxId: tsm.templateSubMaxId,
          distanceMeters: tsm.distanceMeters,
          recordedAt: tsm.recordedAt, // Keep original date
        };
      }
    });

    const data: CreateMyBenchmarkInput = {
      templateId: oldBenchmark.templateId,
      oldBenchmarkId: oldBenchmark.id, // Triggers move to historical
      timeSubMaxes,
      notes: values.notes || undefined,
    };

    await onCreate(data);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!oldBenchmark || !targetTimeSubMax || !template) return null;

  const ageInDays = getTimeSubMaxAgeInDays(targetTimeSubMax);
  const unitLabel = template.distanceUnit === DistanceUnit.KILOMETERS ? 'km' : 'm';
  const displayValue = template.distanceUnit === DistanceUnit.KILOMETERS
    ? (targetTimeSubMax.distanceMeters / 1000).toFixed(2)
    : targetTimeSubMax.distanceMeters.toString();

  // Find template name for this timeSubMax
  const templateSubMax = template.templateTimeSubMaxes?.find(t => t.id === targetTimeSubMax.templateSubMaxId);
  const templateSubMaxName = templateSubMax?.name || 'Unknown';

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
              <Text size="sm" c="dimmed">{templateSubMaxName}</Text>
              <Text size="sm" fw={500}>
                {displayValue} {unitLabel}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Recorded: {formatDate(targetTimeSubMax.recordedAt)}
            </Text>
          </Stack>
        </Paper>

        <Divider label="New Benchmark Values" labelPosition="center" />

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <NumberInput
              label="Distance"
              placeholder={`Enter distance in ${template.distanceUnit === DistanceUnit.KILOMETERS ? 'kilometers' : 'meters'}`}
              value={form.values.distanceValue}
              onChange={(value) => form.setFieldValue('distanceValue', value)}
              error={form.errors.distanceValue}
              required
              min={0}
              step={template.distanceUnit === DistanceUnit.KILOMETERS ? 0.1 : 10}
              decimalScale={template.distanceUnit === DistanceUnit.KILOMETERS ? 2 : 0}
              size="lg"
              leftSection={<IconRun size={18} />}
              description={`Distance covered in ${templateSubMaxName}`}
            />

            <TextInput
              label="Date Recorded"
              type="date"
              {...form.getInputProps('recordedAt')}
              required
              size="lg"
              max={formatDateForInput(new Date())}
              leftSection={<IconCalendar size={18} />}
              description="When did you achieve this distance?"
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
