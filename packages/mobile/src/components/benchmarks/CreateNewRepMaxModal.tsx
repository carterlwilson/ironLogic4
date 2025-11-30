import { Modal, Button, Stack, Textarea, TextInput, Text, Badge, Group, Paper, Divider, NumberInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ClientBenchmark, BenchmarkTemplate, CreateMyBenchmarkInput, RepMax } from '@ironlogic4/shared';
import { IconWeight, IconCalendar } from '@tabler/icons-react';
import { formatDateForInput, formatDate, getRepMaxAgeInDays, parseDateStringToLocalDate } from '../../utils/benchmarkUtils';

interface CreateNewRepMaxModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (data: CreateMyBenchmarkInput) => Promise<void>;
  oldBenchmark: ClientBenchmark | null;
  targetRepMax: RepMax | null;
  template: BenchmarkTemplate | null;
  loading: boolean;
}

export function CreateNewRepMaxModal({
  opened,
  onClose,
  onCreate,
  oldBenchmark,
  targetRepMax,
  template,
  loading,
}: CreateNewRepMaxModalProps) {
  const form = useForm<{
    recordedAt: string;
    notes: string;
    weightKg: number | string;
  }>({
    initialValues: {
      recordedAt: formatDateForInput(new Date()),
      notes: '',
      weightKg: '',
    },
    validate: {
      recordedAt: (value) => (!value ? 'Please select a date' : null),
      weightKg: (value) => {
        if (value === '' || value === undefined) return 'Please enter a weight';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue <= 0) return 'Please enter a valid weight';
        return null;
      },
    },
  });

  // Pre-fill form when modal opens
  useEffect(() => {
    if (opened && targetRepMax) {
      form.reset();
      form.setFieldValue('recordedAt', formatDateForInput(new Date()));
      form.setFieldValue('weightKg', targetRepMax.weightKg);
      form.setFieldValue('notes', '');
    }
  }, [opened, targetRepMax]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!oldBenchmark || !targetRepMax || !template) return;

    const recordedDate = parseDateStringToLocalDate(values.recordedAt);
    const newWeight = typeof values.weightKg === 'string' ? parseFloat(values.weightKg) : values.weightKg;

    // Build repMaxes array: updated target + copied others
    const repMaxes = (oldBenchmark.repMaxes || []).map(rm => {
      if (rm.id === targetRepMax.id) {
        // This is the target rep max - use new values
        return {
          templateRepMaxId: rm.templateRepMaxId,
          weightKg: newWeight,
          recordedAt: recordedDate,
        };
      } else {
        // Copy existing rep max values
        return {
          templateRepMaxId: rm.templateRepMaxId,
          weightKg: rm.weightKg,
          recordedAt: rm.recordedAt, // Keep original date
        };
      }
    });

    const data: CreateMyBenchmarkInput = {
      templateId: oldBenchmark.templateId,
      oldBenchmarkId: oldBenchmark.id, // Triggers move to historical
      repMaxes,
      notes: values.notes || undefined,
    };

    await onCreate(data);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!oldBenchmark || !targetRepMax || !template) return null;

  const ageInDays = getRepMaxAgeInDays(targetRepMax);
  const targetTemplateRepMax = template.templateRepMaxes?.find(
    trm => trm.id === targetRepMax.templateRepMaxId
  );

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create New Rep Max"
      size="lg"
      fullScreen
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Info Text */}
          <Paper p="md" radius="md" bg="orange.0" withBorder>
            <Text size="sm" c="orange.9">
              This rep max is {ageInDays} days old and can no longer be edited directly.
              Create a new benchmark to update your progress. The old benchmark will be moved to your history.
            </Text>
          </Paper>

          {/* Old Rep Max Reference */}
          <div>
            <Text size="xs" c="dimmed" mb="xs">
              Previous Rep Max
            </Text>
            <Paper p="md" radius="md" withBorder bg="gray.0">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={600}>
                    {oldBenchmark.name}
                  </Text>
                  <Badge color="forestGreen" variant="light">
                    {targetTemplateRepMax?.name || 'Rep Max'}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    {formatDate(targetRepMax.recordedAt)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    •
                  </Text>
                  <Text size="sm" fw={500}>
                    {targetRepMax.weightKg} kg
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </div>

          <Divider label="New Rep Max" labelPosition="center" />

          {/* New Rep Max Form */}
          <NumberInput
            label={`${targetTemplateRepMax?.name || 'Rep Max'} (${targetTemplateRepMax?.reps || 1} rep${(targetTemplateRepMax?.reps || 1) > 1 ? 's' : ''})`}
            placeholder="Weight in kg"
            {...form.getInputProps('weightKg')}
            min={0}
            step={0.5}
            decimalScale={1}
            leftSection={<IconWeight size={16} />}
            size="lg"
            required
          />

          <TextInput
            label="Date Recorded"
            type="date"
            {...form.getInputProps('recordedAt')}
            required
            max={formatDateForInput(new Date())}
            size="lg"
            leftSection={<IconCalendar size={16} />}
            description="When did you achieve this rep max?"
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
            Create New Benchmark
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
