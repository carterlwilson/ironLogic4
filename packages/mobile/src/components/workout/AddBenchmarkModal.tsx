import { useState, useEffect, useRef } from 'react';
import { Modal, Stack, NumberInput, Textarea, TextInput, Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconWeight, IconCalendar } from '@tabler/icons-react';
import { BenchmarkTemplate, ClientBenchmark } from '@ironlogic4/shared';
import { createBenchmark, getBenchmarks, getBenchmarkTemplate } from '../../services/benchmarkApi';
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
  const [existingBenchmark, setExistingBenchmark] = useState<ClientBenchmark | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [repMaxValues, setRepMaxValues] = useState<Record<string, number | string>>({});
  const [recordedAt, setRecordedAt] = useState(formatDateForInput(new Date()));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const initialRepMaxValuesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!opened) return;

    setRepMaxValues({});
    setRecordedAt(formatDateForInput(new Date()));
    setNotes('');
    setFullTemplate(null);
    setExistingBenchmark(null);
    initialRepMaxValuesRef.current = {};

    setLoadingData(true);
    Promise.all([
      getBenchmarkTemplate(benchmarkTemplateId),
      getBenchmarks(),
    ])
      .then(([templateRes, benchmarksRes]) => {
        setFullTemplate(templateRes.data);

        const existing = benchmarksRes.data.currentBenchmarks.find(
          (b) => b.templateId === benchmarkTemplateId
        ) ?? null;
        setExistingBenchmark(existing);

        // Pre-populate form with existing rep max values, and remember the originals so
        // submit can tell which buckets the user actually changed vs. left untouched.
        if (existing?.repMaxes) {
          const values: Record<string, number | string> = {};
          const initial: Record<string, number> = {};
          existing.repMaxes.forEach((rm) => {
            if (rm.weightKg > 0) {
              values[rm.templateRepMaxId] = rm.weightKg;
              initial[rm.templateRepMaxId] = rm.weightKg;
            }
          });
          setRepMaxValues(values);
          initialRepMaxValuesRef.current = initial;
        }
      })
      .catch(() => {
        notifications.show({
          title: 'Error',
          message: 'Failed to load benchmark data',
          color: 'red',
        });
      })
      .finally(() => setLoadingData(false));
  }, [opened, benchmarkTemplateId]);

  const handleClose = () => {
    setRepMaxValues({});
    setRecordedAt(formatDateForInput(new Date()));
    setNotes('');
    onClose();
  };

  const getModalTitle = () => {
    if (!existingBenchmark) return `Add Benchmark: ${benchmarkName}`;
    return `Update Benchmark: ${benchmarkName}`;
  };

  const handleSubmit = async () => {
    if (!fullTemplate?.templateRepMaxes?.length) return;

    // Only submit buckets the user actually entered or changed — buckets left as-is
    // are omitted so the server's merge leaves their original recordedAt untouched.
    const formRepMaxes = fullTemplate.templateRepMaxes
      .map((trm) => {
        const val = repMaxValues[trm.id];
        return {
          templateRepMaxId: trm.id,
          weightKg: val && val !== '' ? (typeof val === 'string' ? parseFloat(val) : val) : 0,
        };
      })
      .filter((rm) => rm.weightKg > 0 && rm.weightKg !== initialRepMaxValuesRef.current[rm.templateRepMaxId])
      .map((rm) => ({ ...rm, recordedAt: parseDateStringToLocalDate(recordedAt) }));

    const hasAnyValue = formRepMaxes.length > 0;
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
      let successMessage: string;

      await createBenchmark({
        templateId: benchmarkTemplateId,
        repMaxes: formRepMaxes,
        notes: notes.trim() || undefined,
      });
      successMessage = existingBenchmark
        ? `Benchmark updated for ${benchmarkName}`
        : `Benchmark added for ${benchmarkName}`;

      notifications.show({
        title: 'Benchmark Saved',
        message: successMessage,
        color: 'green',
      });

      handleClose();
      onSuccess();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save benchmark. Please try again.',
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
      title={getModalTitle()}
      centered
    >
      <Stack gap="md">
        {loadingData ? (
          <Text size="sm" c="dimmed">Loading benchmark data...</Text>
        ) : fullTemplate?.templateRepMaxes && fullTemplate.templateRepMaxes.length > 0 ? (
          <>
            <Text size="sm" fw={500}>
              {existingBenchmark
                ? 'Update your rep maxes (existing values pre-filled)'
                : 'Enter your rep maxes (at least one required)'}
            </Text>
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
        ) : !loadingData ? (
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
          <Button onClick={handleSubmit} loading={loading} disabled={loadingData}>
            Save Benchmark
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
