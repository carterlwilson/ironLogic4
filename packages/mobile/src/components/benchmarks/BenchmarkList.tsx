import { Stack, Text, Loader, Center, Paper } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';
import { ClientBenchmark } from '@ironlogic4/shared';
import { BenchmarkCard } from './BenchmarkCard';

interface BenchmarkListProps {
  benchmarks: ClientBenchmark[];
  isHistorical: boolean;
  loading: boolean;
  onEdit: (benchmark: ClientBenchmark) => void;
  onCreateNew: (benchmark: ClientBenchmark) => void;
}

export function BenchmarkList({
  benchmarks,
  isHistorical,
  loading,
  onEdit,
  onCreateNew,
}: BenchmarkListProps) {
  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (benchmarks.length === 0) {
    return (
      <Paper p="xl" radius="md" withBorder>
        <Stack align="center" gap="md">
          <IconMoodEmpty size={48} style={{ opacity: 0.3 }} />
          <div>
            <Text size="lg" fw={500} ta="center">
              {isHistorical ? 'No historical benchmarks' : 'No current benchmarks'}
            </Text>
            <Text size="sm" c="dimmed" ta="center" mt="xs">
              {isHistorical
                ? 'Historical benchmarks will appear here when you create new ones from old benchmarks'
                : 'Create your first benchmark to start tracking your progress'}
            </Text>
          </div>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="sm">
      {benchmarks.map((benchmark) => (
        <BenchmarkCard
          key={benchmark.id}
          benchmark={benchmark}
          isHistorical={isHistorical}
          onEdit={onEdit}
          onCreateNew={onCreateNew}
        />
      ))}
    </Stack>
  );
}