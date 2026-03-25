import { useState, useEffect } from 'react';
import { Modal, Stack, NumberInput, Textarea, TextInput, Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconWeight, IconCalendar } from '@tabler/icons-react';
import { BenchmarkTemplate } from '@ironlogic4/shared';
import { createBenchmark, getBenchmarkTemplate } from '../../services/benchmarkApi';
import { formatDateForInput, parseDateStringToLocalDate } from '../../utils/benchmarkUtils';

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
  const [fullTemplate, setFullTemplate] = useState<BenchmarkTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [repMaxValues, setRepMaxValues] = useState<Record<string, number | string>>({});
  const [recordedAt, setRecordedAt] = useState(formatDateForInput(new Date()));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!opened) return;

    setRepMaxValues({});
    setRecordedAt(formatDateForInput(new Date()));
    setNotes('');
    setFullTemplate(null);

    setLoadingTemplate(true);
    getBenchmarkTemplate(benchmarkTemplateId)
      .then((res) => setFullTemplate(res.data))
      .catch(() => {
        notifications.show({
          title: 'Error',
          message: 'Failed to load benchmark template',
          color: 'red',
        });
      })
      .finally(() => setLoadingTemplate(false));
  }, [opened, benchmarkTemplateId]);

  const handleClose = () => {
    setRepMaxValues({});
    setRecordedAt(formatDateForInput(new Date()));
    setNotes('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!fullTemplate?.templateRepMaxes?.length) return;

    const repMaxes = fullTemplate.templateRepMaxes.map((trm) => {
      const val = repMaxValues[trm.id];
      return {
        templateRepMaxId: trm.id,
        weightKg: val && val !== '' ? (typeof val === 'string' ? parseFloat(val) : val) : 0,
        recordedAt: parseDateStringToLocalDate(recordedAt),
      };
    });

    const hasAnyValue = repMaxes.some((rm) => rm.weightKg > 0);
    if (!hasAnyValue) {
      notifications.show({
        title: 'Missing Data',
        message: 'Please enter at least one rep max weight',
        color: 'red',
      });
      return;
    }

    if (!recordedAt) {
      notifications.show({
        title: 'Invalid Date',
        message: 'Please select a date',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      await createBenchmark({
        templateId: benchmarkTemplateId,
        repMaxes,
        notes: notes.trim() || undefined,
      });

      notifications.show({
        title: 'Benchmark Added',
        message: `Successfully added benchmark for ${benchmarkName}`,
        color: 'green',
      });

      handleClose();
      onSuccess();
    } catch (error) {
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
        {loadingTemplate ? (
          <Text size="sm" c="dimmed">Loading rep max options...</Text>
        ) : fullTemplate?.templateRepMaxes && fullTemplate.templateRepMaxes.length > 0 ? (
          <>
            <Text size="sm" fw={500}>Enter your rep maxes (at least one required)</Text>
            {fullTemplate.templateRepMaxes
              .sort((a, b) => a.reps - b.reps)
              .map((trm) => (
                <NumberInput
                  key={trm.id}
                  label={`${trm.name} (${trm.reps} rep${trm.reps > 1 ? 's' : ''})`}
                  placeholder="Weight in kg"
                  value={repMaxValues[trm.id] || ''}
                  onChange={(val) => setRepMaxValues((prev) => ({ ...prev, [trm.id]: val }))}
                  min={0}
                  step={0.5}
                  decimalScale={1}
                  leftSection={<IconWeight size={16} />}
                  disabled={loading}
                />
              ))}
          </>
        ) : !loadingTemplate ? (
          <Text size="sm" c="red">No rep max options available for this template</Text>
        ) : null}

        <TextInput
          label="Date Recorded"
          type="date"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.currentTarget.value)}
          max={formatDateForInput(new Date())}
          required
          leftSection={<IconCalendar size={16} />}
          disabled={loading}
        />

        <Textarea
          label="Notes (Optional)"
          placeholder="Add any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          minRows={3}
          maxRows={5}
          maxLength={1000}
          disabled={loading}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={loadingTemplate}>
            Save Benchmark
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
