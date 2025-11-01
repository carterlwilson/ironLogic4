import { Modal, Stack, Text, Group, Button, Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';

interface DeleteBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  benchmark: ClientBenchmark | null;
  onConfirm: (benchmark: ClientBenchmark) => Promise<void>;
  loading?: boolean;
}

export function DeleteBenchmarkModal({
  opened,
  onClose,
  benchmark,
  onConfirm,
  loading = false,
}: DeleteBenchmarkModalProps) {
  const handleConfirm = async () => {
    if (!benchmark) return;

    try {
      await onConfirm(benchmark);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!benchmark) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Benchmark"
      size="md"
      centered
    >
      <Stack gap="md">
        <Alert icon={<IconAlertTriangle size={16} />} color="red">
          This action cannot be undone.
        </Alert>

        <Text>
          Are you sure you want to delete the benchmark{' '}
          <Text component="span" fw={600}>
            {benchmark.name}
          </Text>
          ?
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
            color="red"
            onClick={handleConfirm}
            loading={loading}
          >
            Delete Benchmark
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}