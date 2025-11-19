import { useState } from 'react';
import { Modal, Stack, NumberInput, Textarea, Button, Group } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconWeight } from '@tabler/icons-react';
import { createBenchmark } from '../../services/benchmarkApi';

interface AddBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  benchmarkTemplateId: string;
  benchmarkName: string;
  onSuccess: () => void;
}

export function AddBenchmarkModal({
  opened,
  onClose,
  benchmarkTemplateId,
  benchmarkName,
  onSuccess,
}: AddBenchmarkModalProps) {
  const [weight, setWeight] = useState<number | string>('');
  const [date, setDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setWeight('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    // Validate weight
    const weightValue = typeof weight === 'number' ? weight : parseFloat(weight);
    if (!weightValue || weightValue <= 0) {
      notifications.show({
        title: 'Invalid Weight',
        message: 'Please enter a valid weight greater than 0 kg',
        color: 'red',
      });
      return;
    }

    if (weightValue > 1000) {
      notifications.show({
        title: 'Invalid Weight',
        message: 'Weight must be less than 1000 kg',
        color: 'red',
      });
      return;
    }

    if (!date) {
      notifications.show({
        title: 'Invalid Date',
        message: 'Please select a date',
        color: 'red',
      });
      return;
    }

    if (notes.length > 1000) {
      notifications.show({
        title: 'Notes Too Long',
        message: 'Notes must be less than 1000 characters',
        color: 'red',
      });
      return;
    }

    setLoading(true);

    try {
      await createBenchmark({
        templateId: benchmarkTemplateId,
        recordedAt: new Date(date),
        weightKg: weightValue,
        notes: notes.trim() || undefined,
      });

      notifications.show({
        title: 'Benchmark Added',
        message: `Successfully added benchmark for ${benchmarkName}`,
        color: 'green',
      });

      handleReset();
      onSuccess();
    } catch (error) {
      console.error('Error creating benchmark:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to add benchmark. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Add Benchmark: ${benchmarkName}`}
      centered
    >
      <Stack gap="md">
        <NumberInput
          label="Weight"
          placeholder="Enter weight"
          value={weight}
          onChange={setWeight}
          min={0}
          max={1000}
          step={2.5}
          decimalScale={2}
          suffix=" kg"
          leftSection={<IconWeight size={18} />}
          required
          disabled={loading}
        />

        <DatePickerInput
          label="Date"
          placeholder="Select date"
          value={date}
          onChange={setDate}
          maxDate={new Date()}
          required
          disabled={loading}
        />

        <Textarea
          label="Notes"
          placeholder="Optional notes about this benchmark"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          minRows={3}
          maxRows={6}
          maxLength={1000}
          disabled={loading}
        />

        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
          >
            Save Benchmark
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}