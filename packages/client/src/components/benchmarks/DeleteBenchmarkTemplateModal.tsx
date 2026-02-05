import { Modal, Stack, Text, Group, Button, Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';

interface DeleteBenchmarkTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  template: BenchmarkTemplate | null;
  onConfirm: (template: BenchmarkTemplate) => Promise<void>;
  loading?: boolean;
}

export function DeleteBenchmarkTemplateModal({
  opened,
  onClose,
  template,
  onConfirm,
  loading = false,
}: DeleteBenchmarkTemplateModalProps) {
  const handleConfirm = async () => {
    if (!template) return;

    await onConfirm(template);
    // Only runs on success
    onClose();
  };

  if (!template) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Benchmark Template"
      centered
      size="md"
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Warning"
          color="red"
        >
          This action cannot be undone. Any client benchmarks using this template may be affected.
        </Alert>

        <Text>
          Are you sure you want to delete the benchmark template <strong>{template.name}</strong>?
        </Text>

        {template.notes && (
          <Text size="sm" c="dimmed">
            Notes: {template.notes}
          </Text>
        )}

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
            Delete Template
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}