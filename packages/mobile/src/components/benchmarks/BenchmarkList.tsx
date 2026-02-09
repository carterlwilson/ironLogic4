import { Stack, Text, Loader, Center, Paper } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';
import { ClientBenchmark, BenchmarkTemplate, RepMax, TimeSubMax, DistanceSubMax } from '@ironlogic4/shared';
import { DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
import { BenchmarkCard } from './BenchmarkCard';

interface BenchmarkListProps {
  benchmarks: ClientBenchmark[];
  isHistorical: boolean;
  loading: boolean;
  onEdit: (benchmark: ClientBenchmark) => void;
  onCreateNew: (benchmark: ClientBenchmark) => void;
  benchmarkTemplates?: Map<string, BenchmarkTemplate>;
  onEditRepMax?: (repMax: RepMax, benchmarkId: string, allRepMaxes: RepMax[], templateRepMaxName: string, benchmarkName: string) => void;
  onCreateNewRepMax?: (repMax: RepMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateRepMaxName: string, templateRepMaxReps: number) => void;
  onEditTimeSubMax?: (timeSubMax: TimeSubMax, benchmarkId: string, allTimeSubMaxes: TimeSubMax[], templateSubMaxName: string, benchmarkName: string, distanceUnit: DistanceUnit) => void;
  onCreateNewTimeSubMax?: (timeSubMax: TimeSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateSubMaxName: string) => void;
  onEditDistanceSubMax?: (distanceSubMax: DistanceSubMax, benchmarkId: string, allDistanceSubMaxes: DistanceSubMax[], templateDistanceSubMaxName: string, benchmarkName: string) => void;
  onCreateNewDistanceSubMax?: (distanceSubMax: DistanceSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateDistanceSubMaxName: string) => void;
}

export function BenchmarkList({
  benchmarks,
  isHistorical,
  loading,
  onEdit,
  onCreateNew,
  benchmarkTemplates,
  onEditRepMax,
  onCreateNewRepMax,
  onEditTimeSubMax,
  onCreateNewTimeSubMax,
  onEditDistanceSubMax,
  onCreateNewDistanceSubMax,
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
          template={benchmarkTemplates?.get(benchmark.templateId)}
          onEditRepMax={onEditRepMax ? (repMax, benchmarkId, allRepMaxes, templateRepMaxName) => {
            onEditRepMax(repMax, benchmarkId, allRepMaxes, templateRepMaxName, benchmark.name);
          } : undefined}
          onCreateNewRepMax={onCreateNewRepMax}
          onEditTimeSubMax={onEditTimeSubMax}
          onCreateNewTimeSubMax={onCreateNewTimeSubMax}
          onEditDistanceSubMax={onEditDistanceSubMax}
          onCreateNewDistanceSubMax={onCreateNewDistanceSubMax}
        />
      ))}
    </Stack>
  );
}