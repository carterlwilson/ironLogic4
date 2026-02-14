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
import { SortableDayItem } from './SortableDayItem';
import { reorderDays } from '../../../utils/programHelpers';
import type { IDay, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';

interface DayListProps {
  weekId: string;
  days: IDay[];
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  onProgramChangeWithAutoSave?: (program: IProgram) => void;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  benchmarkTemplates: BenchmarkTemplate[];
  weightBenchmarkOptions: Array<{ value: string; label: string }>;
  distanceBenchmarkOptions: Array<{ value: string; label: string }>;
  timeBenchmarkOptions: Array<{ value: string; label: string }>;
}

export function DayList({ weekId, days, program, onProgramChange, onProgramChangeWithAutoSave, expandedIds, toggleExpanded, templateMap, templates, benchmarkTemplates, weightBenchmarkOptions, distanceBenchmarkOptions, timeBenchmarkOptions }: DayListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sortedDays = [...days].sort((a, b) => a.order - b.order);
      const oldIndex = sortedDays.findIndex(d => d.id === active.id);
      const newIndex = sortedDays.findIndex(d => d.id === over.id);

      const reorderedDays = arrayMove(sortedDays, oldIndex, newIndex);
      const updated = reorderDays(program, weekId, reorderedDays);

      if (onProgramChangeWithAutoSave) {
        onProgramChangeWithAutoSave(updated);
      } else {
        onProgramChange(updated);
      }
    }
  };

  if (days.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        No days in this week yet.
      </Text>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={days} strategy={verticalListSortingStrategy}>
        <Stack gap="md">
          {[...days]
            .sort((a, b) => a.order - b.order)
            .map((day) => (
              <SortableDayItem
                key={day.id}
                day={day}
                weekId={weekId}
                program={program}
                onProgramChange={onProgramChange}
                onProgramChangeWithAutoSave={onProgramChangeWithAutoSave}
                isExpanded={expandedIds.has(day.id)}
                onToggleExpanded={() => toggleExpanded(day.id)}
                templateMap={templateMap}
                templates={templates}
                benchmarkTemplates={benchmarkTemplates}
                weightBenchmarkOptions={weightBenchmarkOptions}
                distanceBenchmarkOptions={distanceBenchmarkOptions}
                timeBenchmarkOptions={timeBenchmarkOptions}
              />
            ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}