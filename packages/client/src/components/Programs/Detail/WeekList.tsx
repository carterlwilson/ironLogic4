import { Stack, Text } from '@mantine/core';
import { WeekItem } from './WeekItem';
import type { IWeek, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { ActivityGroup } from '@ironlogic4/shared/types/activityGroups';

interface WeekListProps {
  blockId: string;
  weeks: IWeek[];
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  activityGroups: ActivityGroup[];
}

export function WeekList({ blockId, weeks, program, onProgramChange, templateMap, templates, activityGroups }: WeekListProps) {
  if (weeks.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        No weeks in this block yet.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {[...weeks]
        .sort((a, b) => a.order - b.order)
        .map((week) => (
          <WeekItem
            key={week.id}
            week={week}
            blockId={blockId}
            program={program}
            onProgramChange={onProgramChange}
            templateMap={templateMap}
            templates={templates}
            activityGroups={activityGroups}
          />
        ))}
    </Stack>
  );
}