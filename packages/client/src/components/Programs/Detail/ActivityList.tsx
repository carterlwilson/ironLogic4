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
} from '@dnd-kit/sortable';
import { SortableActivityCard } from './SortableActivityCard';
import { reorderActivities } from '../../../utils/programHelpers';
import type { IActivity, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';

interface ActivityListProps {
  dayId: string;
  activities: IActivity[];
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
}

export function ActivityList({ dayId, activities, program, onProgramChange, templateMap, templates }: ActivityListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedActivities = [...activities].sort((a, b) => a.order - b.order);
  const activityIds = sortedActivities.map(a => a.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activityIds.indexOf(active.id as string);
      const newIndex = activityIds.indexOf(over.id as string);

      // Create new order array
      const newOrder = [...activityIds];
      const [movedItem] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedItem);

      // Update program with new order
      const updated = reorderActivities(program, dayId, newOrder);
      onProgramChange(updated);
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
      <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
        <Stack gap="sm">
          {sortedActivities.map((activity) => (
            <SortableActivityCard
              key={activity.id}
              activity={activity}
              dayId={dayId}
              program={program}
              onProgramChange={onProgramChange}
              templateMap={templateMap}
              templates={templates}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}