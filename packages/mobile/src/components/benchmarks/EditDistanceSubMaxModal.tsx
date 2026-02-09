import { Modal, Button, Stack, Text, Badge, Group, NumberInput, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { IconClock, IconCalendar } from '@tabler/icons-react';
import { DistanceSubMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { formatDateForInput, getDistanceSubMaxAgeInDays } from '../../utils/benchmarkUtils';

interface EditDistanceSubMaxModalProps {
  opened: boolean;
  onClose: () => void;
  distanceSubMax: DistanceSubMax | null;
  benchmarkId: string;
  benchmarkName: string;
  templateDistanceSubMaxName: string;  // "100m", "400m", etc.
  onUpdate: (benchmarkId: string, updatedDistanceSubMaxes: DistanceSubMax[]) => Promise<void>;
  allDistanceSubMaxes: DistanceSubMax[];
  loading: boolean;
}

export function EditDistanceSubMaxModal({
  opened,
  onClose,
  distanceSubMax,
  benchmarkName,
  templateDistanceSubMaxName,
  onUpdate,
  allDistanceSubMaxes,
  benchmarkId,
  loading,
}: EditDistanceSubMaxModalProps) {
  const form = useForm<{
    timeSeconds: number | string;
    recordedAt: string;
  }>({
    initialValues: {
      timeSeconds: '',
      recordedAt: '',
    },
    validate: {
      timeSeconds: (value) => {
        if (value === '' || value === undefined) {
          return 'Please enter a time';
        }
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num) || num <= 0) {
          return 'Time must be a positive number';
        }
        return null;
      },
      recordedAt: (value) => (!value ? 'Please select a date' : null),
    },
  });

  // Initialize form when distanceSubMax changes
  useEffect(() => {
    if (distanceSubMax && opened) {
      form.setValues({
        timeSeconds: distanceSubMax.timeSeconds,
        recordedAt: formatDateForInput(new Date()),
      });
    }
  }, [distanceSubMax, opened]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!distanceSubMax) return;

    // Create updated distanceSubMax
    const updatedDistanceSubMax: DistanceSubMax = {
      ...distanceSubMax,
      timeSeconds: typeof values.timeSeconds === 'string' ? parseFloat(values.timeSeconds) : values.timeSeconds,
      recordedAt: new Date(values.recordedAt),
      updatedAt: new Date(),
    };

    // Update the distanceSubMax in the array
    const updatedDistanceSubMaxes = allDistanceSubMaxes.map((dsm) =>
      dsm.id === distanceSubMax.id ? updatedDistanceSubMax : dsm
    );

    await onUpdate(benchmarkId, updatedDistanceSubMaxes);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!distanceSubMax) return null;

  const ageInDays = getDistanceSubMaxAgeInDays(distanceSubMax);
  const daysLeft = 14 - ageInDays;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Edit ${templateDistanceSubMaxName}`}
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
                {templateDistanceSubMaxName}
              </Badge>
            </Group>

            {daysLeft <= 3 && daysLeft > 0 && (
              <Badge color="yellow" variant="light" size="sm" fullWidth>
                Editable window closing in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

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

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
