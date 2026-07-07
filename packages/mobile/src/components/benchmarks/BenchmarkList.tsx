import { Stack, Text, Loader, Center, Paper } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';
import { ClientBenchmark, BenchmarkTemplate, RepMax, TimeSubMax, DistanceSubMax } from '@ironlogic4/shared';
import { BenchmarkCard } from './BenchmarkCard';

interface BenchmarkListProps {
  benchmarks: ClientBenchmark[];
  isHistorical: boolean;
  loading: boolean;
  onEdit: (benchmark: ClientBenchmark) => void;
  benchmarkTemplates?: Map<string, BenchmarkTemplate>;
  onUpdateRepMax?: (repMax: RepMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateRepMaxName: string, templateRepMaxReps: number) => void;
  onUpdateTimeSubMax?: (timeSubMax: TimeSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateSubMaxName: string) => void;
  onUpdateDistanceSubMax?: (distanceSubMax: DistanceSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateDistanceSubMaxName: string) => void;
  onDelete?: (benchmark: ClientBenchmark) => void;
}

export function BenchmarkList({
  benchmarks,
  isHistorical,
  loading,
  onEdit,
  benchmarkTemplates,
  onUpdateRepMax,
  onUpdateTimeSubMax,
  onUpdateDistanceSubMax,
  onDelete,
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
                ? 'Historical benchmarks will appear here when you update your benchmarks'
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
          template={benchmarkTemplates?.get(benchmark.templateId)}
          onUpdateRepMax={onUpdateRepMax}
          onUpdateTimeSubMax={onUpdateTimeSubMax}
          onUpdateDistanceSubMax={onUpdateDistanceSubMax}
          onDelete={onDelete}
        />
      ))}
    </Stack>
  );
}
