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
import { SortableActivityCard } from './SortableActivityCard';
import { reorderActivities } from '../../../utils/programHelpers';
import type { IActivity, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';

interface ActivityListProps {
  dayId: string;
  activities: IActivity[];
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  onProgramChangeWithAutoSave?: (program: IProgram) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  benchmarkTemplates: BenchmarkTemplate[];
  weightBenchmarkOptions: Array<{ value: string; label: string }>;
  distanceBenchmarkOptions: Array<{ value: string; label: string }>;
  timeBenchmarkOptions: Array<{ value: string; label: string }>;
}

export function ActivityList({ dayId, activities, program, onProgramChange, onProgramChangeWithAutoSave, templateMap, templates, benchmarkTemplates, weightBenchmarkOptions, distanceBenchmarkOptions, timeBenchmarkOptions }: ActivityListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activities.findIndex(a => a.id === active.id);
      const newIndex = activities.findIndex(a => a.id === over.id);

      const reorderedActivities = arrayMove(activities, oldIndex, newIndex);
      const updated = reorderActivities(program, dayId, reorderedActivities);

      // Use auto-save callback if provided
      if (onProgramChangeWithAutoSave) {
        onProgramChangeWithAutoSave(updated);
      } else {
        onProgramChange(updated);
      }
    }
  };

  if (activities.length === 0) {
    return (
      <Text size="xs" c="dimmed" ta="center" py="sm">
        No activities in this day yet.
      </Text>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={activities} strategy={verticalListSortingStrategy}>
        <Stack gap="sm">
          {activities.map((activity) => (
            <SortableActivityCard
              key={activity.id}
              activity={activity}
              dayId={dayId}
              program={program}
              onProgramChange={onProgramChange}
              onProgramChangeWithAutoSave={onProgramChangeWithAutoSave}
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