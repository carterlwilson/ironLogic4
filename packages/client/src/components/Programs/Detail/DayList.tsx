import { Stack, Text } from '@mantine/core';
import { DayItem } from './DayItem';
import type { IDay, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';

interface DayListProps {
  weekId: string;
  days: IDay[];
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  benchmarkTemplates: BenchmarkTemplate[];
  weightBenchmarkOptions: Array<{ value: string; label: string }>;
}

export function DayList({ weekId, days, program, onProgramChange, templateMap, templates, benchmarkTemplates, weightBenchmarkOptions }: DayListProps) {
  if (days.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        No days in this week yet.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {[...days]
        .sort((a, b) => a.order - b.order)
        .map((day) => (
          <DayItem
            key={day.id}
            day={day}
            weekId={weekId}
            program={program}
            onProgramChange={onProgramChange}
            templateMap={templateMap}
            templates={templates}
            benchmarkTemplates={benchmarkTemplates}
            weightBenchmarkOptions={weightBenchmarkOptions}
          />
        ))}
    </Stack>
  );
}