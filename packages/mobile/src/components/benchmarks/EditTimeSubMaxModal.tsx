import { Modal, Button, Stack, Text, Badge, Group, NumberInput, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { IconRun, IconCalendar } from '@tabler/icons-react';
import { TimeSubMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
import { formatDateForInput, getTimeSubMaxAgeInDays, convertDistanceToMeters } from '../../utils/benchmarkUtils';

interface EditTimeSubMaxModalProps {
  opened: boolean;
  onClose: () => void;
  timeSubMax: TimeSubMax | null;
  benchmarkId: string;
  benchmarkName: string;
  templateSubMaxName: string;  // "1 min", "3 min", etc.
  distanceUnit: DistanceUnit;
  onUpdate: (benchmarkId: string, updatedTimeSubMaxes: TimeSubMax[]) => Promise<void>;
  allTimeSubMaxes: TimeSubMax[];
  loading: boolean;
}

export function EditTimeSubMaxModal({
  opened,
  onClose,
  timeSubMax,
  benchmarkName,
  templateSubMaxName,
  distanceUnit,
  onUpdate,
  allTimeSubMaxes,
  benchmarkId,
  loading,
}: EditTimeSubMaxModalProps) {
  const form = useForm<{
    distanceValue: number | string;
    recordedAt: string;
  }>({
    initialValues: {
      distanceValue: '',
      recordedAt: '',
    },
    validate: {
      distanceValue: (value) => {
        if (value === '' || value === undefined) {
          return 'Please enter a distance';
        }
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num) || num < 0) {
          return 'Distance must be a positive number';
        }
        return null;
      },
      recordedAt: (value) => (!value ? 'Please select a date' : null),
    },
  });

  // Initialize form when timeSubMax changes
  useEffect(() => {
    if (timeSubMax && opened) {
      // Convert meters to display unit
      const displayValue = distanceUnit === DistanceUnit.KILOMETERS
        ? timeSubMax.distanceMeters / 1000
        : timeSubMax.distanceMeters;

      form.setValues({
        distanceValue: displayValue,
        recordedAt: formatDateForInput(new Date()),
      });
    }
  }, [timeSubMax, opened, distanceUnit]);

  const handleSubmit = form.onSubmit(async (values) => {
    if (!timeSubMax) return;

    // Convert display value back to meters
    const distanceMeters = distanceUnit === DistanceUnit.KILOMETERS
      ? convertDistanceToMeters(
          typeof values.distanceValue === 'string' ? parseFloat(values.distanceValue) : values.distanceValue,
          DistanceUnit.KILOMETERS
        )
      : (typeof values.distanceValue === 'string' ? parseFloat(values.distanceValue) : values.distanceValue);

    // Create updated timeSubMax
    const updatedTimeSubMax: TimeSubMax = {
      ...timeSubMax,
      distanceMeters,
      recordedAt: new Date(values.recordedAt),
      updatedAt: new Date(),
    };

    // Update the timeSubMax in the array
    const updatedTimeSubMaxes = allTimeSubMaxes.map((tsm) =>
      tsm.id === timeSubMax.id ? updatedTimeSubMax : tsm
    );

    await onUpdate(benchmarkId, updatedTimeSubMaxes);
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!timeSubMax) return null;

  const ageInDays = getTimeSubMaxAgeInDays(timeSubMax);
  const daysLeft = 14 - ageInDays;
  const unitLabel = distanceUnit === DistanceUnit.KILOMETERS ? 'kilometers' : 'meters';

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Edit ${templateSubMaxName}`}
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
                {templateSubMaxName}
              </Badge>
            </Group>

            {daysLeft <= 3 && daysLeft > 0 && (
              <Badge color="yellow" variant="light" size="sm" fullWidth>
                Editable window closing in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <NumberInput
            label="Distance"
            placeholder={`Enter distance in ${unitLabel}`}
            value={form.values.distanceValue}
            onChange={(value) => form.setFieldValue('distanceValue', value)}
            error={form.errors.distanceValue}
            required
            min={0}
            step={distanceUnit === DistanceUnit.KILOMETERS ? 0.1 : 10}
            decimalScale={distanceUnit === DistanceUnit.KILOMETERS ? 2 : 0}
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

          <Button type="submit" fullWidth size="lg" loading={loading}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
