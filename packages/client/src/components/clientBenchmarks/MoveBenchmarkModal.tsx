import { Modal, Stack, Text, Group, Button } from '@mantine/core';
import { IconArrowsExchange } from '@tabler/icons-react';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';

interface MoveBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  benchmark: ClientBenchmark | null;
  isCurrentlyInCurrent: boolean;
  onConfirm: (benchmark: ClientBenchmark, moveToHistorical: boolean) => Promise<void>;
  loading?: boolean;
}

export function MoveBenchmarkModal({
  opened,
  onClose,
  benchmark,
  isCurrentlyInCurrent,
  onConfirm,
  loading = false,
}: MoveBenchmarkModalProps) {
  const handleConfirm = async () => {
    if (!benchmark) return;

    try {
      await onConfirm(benchmark, isCurrentlyInCurrent);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!benchmark) return null;

  const destination = isCurrentlyInCurrent ? 'Historical' : 'Current';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Move Benchmark"
      size="md"
      centered
    >
      <Stack gap="md">
        <Group>
          <IconArrowsExchange size={24} color="violet" />
          <Text>
            Move <Text component="span" fw={600}>{benchmark.name}</Text> to {destination} Benchmarks?
          </Text>
        </Group>

        <Text size="sm" c="dimmed">
          This will move the benchmark from {isCurrentlyInCurrent ? 'Current' : 'Historical'} to {destination}.
        </Text>

        <Group justify="flex-end" gap="md" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="violet"
            onClick={handleConfirm}
            loading={loading}
            leftSection={<IconArrowsExchange size={16} />}
          >
            Move to {destination}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}