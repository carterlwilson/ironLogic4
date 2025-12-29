import { Modal, Button, Stack, Text, Badge, Group, NumberInput, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { IconWeight, IconCalendar } from '@tabler/icons-react';
import { RepMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { formatDateForInput, getRepMaxAgeInDays } from '../../utils/benchmarkUtils';

interface EditRepMaxModalProps {
  opened: boolean;
  onClose: () => void;
  repMax: RepMax | null;
  benchmarkId: string;
  benchmarkName: string;
  templateRepMaxName: string;
  onUpdate: (benchmarkId: string, updatedRepMaxes: RepMax[]) => Promise<void>;
  allRepMaxes: RepMax[];  // All repMaxes for this benchmark
  loading: boolean;
}

export function EditRepMaxModal({
  opened,
  onClose,
  repMax,
  benchmarkName,
  templateRepMaxName,
  onUpdate,
  allRepMaxes,
  benchmarkId,
  loading,
}: EditRepMaxModalProps) {
  const form = useForm<{
    weightKg: number | string;
    recordedAt: string;
  }>({
    initialValues: {
      weightKg: '',
      recordedAt: '',
    },
    validate: {
      weightKg: (value) => {
        if (value === '' || value === undefined) {
          return 'Please enter a weight';
        }
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num) || num <= 0) {
          return 'Weight must be a positive number';
        }
        return null;
      },
      recordedAt: (value) => (!value ? 'Please select a date' : null),
    },
  });

  // Initialize form when repMax changes
  useEffect(() => {
    if (repMax && opened) {
      form.setValues({
        weightKg: repMax.weightKg,
        recordedAt: formatDateForInput(new Date()),
      });
    }
  }, [repMax, opened]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!repMax) return;

    // Create updated repMax
    const updatedRepMax: RepMax = {
      ...repMax,
      weightKg: typeof values.weightKg === 'string' ? parseFloat(values.weightKg) : values.weightKg,
      recordedAt: new Date(values.recordedAt),
      updatedAt: new Date(),
    };

    // Update the repMax in the array
    const updatedRepMaxes = allRepMaxes.map((rm) =>
      rm.id === repMax.id ? updatedRepMax : rm
    );

    await onUpdate(benchmarkId, updatedRepMaxes);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!repMax) return null;

  const ageInDays = getRepMaxAgeInDays(repMax);
  const daysLeft = 14 - ageInDays;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Edit ${templateRepMaxName}`}
      size="lg"
      fullScreen
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Benchmark Info Header */}
          <div>
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="lg">
                {benchmarkName}
              </Text>
              <Badge color="forestGreen" variant="light" size="lg">
                {templateRepMaxName}
              </Badge>
            </Group>

            {daysLeft <= 3 && daysLeft > 0 && (
              <Badge color="yellow" variant="light" size="sm" fullWidth>
                Editable window closing in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <NumberInput
            label="Weight"
            placeholder="Enter weight in kg"
            value={form.values.weightKg}
            onChange={(value) => form.setFieldValue('weightKg', value)}
            error={form.errors.weightKg}
            required
            min={0}
            step={0.5}
            decimalScale={1}
            size="lg"
            leftSection={<IconWeight size={18} />}
            description="Your maximum weight for this rep range"
          />

          <TextInput
            label="Date Recorded"
            type="date"
            {...form.getInputProps('recordedAt')}
            required
            size="lg"
            max={formatDateForInput(new Date())}
            leftSection={<IconCalendar size={18} />}
            description="When did you achieve this rep max?"
          />

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}