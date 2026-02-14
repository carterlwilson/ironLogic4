import { Stack, Text } from '@mantine/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SortableWeekItem } from './SortableWeekItem';
import { reorderWeeks } from '../../../utils/programHelpers';
import type { IWeek, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ActivityGroupOption } from '../../../hooks/useActivityGroupOptions';

interface WeekListProps {
  blockId: string;
  weeks: IWeek[];
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  onProgramChangeWithAutoSave?: (program: IProgram) => void;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  groupOptions: ActivityGroupOption[];
  benchmarkTemplates: BenchmarkTemplate[];
  weightBenchmarkOptions: Array<{ value: string; label: string }>;
  distanceBenchmarkOptions: Array<{ value: string; label: string }>;
  timeBenchmarkOptions: Array<{ value: string; label: string }>;
  isCurrentBlock?: boolean;
}

export function WeekList({ blockId, weeks, program, onProgramChange, onProgramChangeWithAutoSave, expandedIds, toggleExpanded, templateMap, templates, groupOptions, benchmarkTemplates, weightBenchmarkOptions, distanceBenchmarkOptions, timeBenchmarkOptions, isCurrentBlock }: WeekListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sortedWeeks = [...weeks].sort((a, b) => a.order - b.order);
      const oldIndex = sortedWeeks.findIndex(w => w.id === active.id);
      const newIndex = sortedWeeks.findIndex(w => w.id === over.id);

      const reorderedWeeks = arrayMove(sortedWeeks, oldIndex, newIndex);
      const updated = reorderWeeks(program, blockId, reorderedWeeks);

      if (onProgramChangeWithAutoSave) {
        onProgramChangeWithAutoSave(updated);
      } else {
        onProgramChange(updated);
      }
    }
  };

  if (weeks.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        No weeks in this block yet.
      </Text>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={weeks} strategy={verticalListSortingStrategy}>
        <Stack gap="md">
          {[...weeks]
            .sort((a, b) => a.order - b.order)
            .map((week) => {
              const isCurrentWeek = isCurrentBlock && week.order === program.currentProgress.weekIndex;
              return (
                <SortableWeekItem
                  key={week.id}
                  week={week}
                  blockId={blockId}
                  program={program}
                  onProgramChange={onProgramChange}
                  onProgramChangeWithAutoSave={onProgramChangeWithAutoSave}
                  isExpanded={expandedIds.has(week.id)}
                  onToggleExpanded={() => toggleExpanded(week.id)}
                  expandedIds={expandedIds}
                  toggleExpanded={toggleExpanded}
                  templateMap={templateMap}
                  templates={templates}
                  groupOptions={groupOptions}
                  benchmarkTemplates={benchmarkTemplates}
                  weightBenchmarkOptions={weightBenchmarkOptions}
                  distanceBenchmarkOptions={distanceBenchmarkOptions}
                  timeBenchmarkOptions={timeBenchmarkOptions}
                  isCurrentWeek={isCurrentWeek}
                />
              );
            })}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}