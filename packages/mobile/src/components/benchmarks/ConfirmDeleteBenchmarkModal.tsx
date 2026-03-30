import { Modal, Button, Group, Text, Stack, List, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconPoint } from '@tabler/icons-react';

interface ConfirmDeleteBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  benchmarkName: string;
  loading: boolean;
}

export function ConfirmDeleteBenchmarkModal({
  opened,
  onClose,
  onConfirm,
  benchmarkName,
  loading,
}: ConfirmDeleteBenchmarkModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
          <Text fw={700} c="red">Delete Benchmark</Text>
        </Group>
      }
      size="sm"
      centered
    >
      <Stack gap="md">
        <Text size="sm">
          <Text span fw={600}>"{benchmarkName}"</Text> and all of its data will be permanently
          deleted, including:
        </Text>

        <List
          size="sm"
          spacing="xs"
          icon={
            <ThemeIcon color="red" size={16} radius="xl" variant="light">
              <IconPoint size={10} />
            </ThemeIcon>
          }
        >
          <List.Item>All historical entries</List.Item>
          <List.Item>All progress history</List.Item>
        </List>

        <Text size="sm" fw={700} c="red">
          This action cannot be undone.
        </Text>

        <Group justify="flex-end" gap="sm" mt="xs">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="filled" color="red" onClick={onConfirm} loading={loading}>
            Delete Forever
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
