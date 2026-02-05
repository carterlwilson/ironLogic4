import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActivityCard } from './ActivityCard';
import type { IActivity, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';

interface SortableActivityCardProps {
  activity: IActivity;
  dayId: string;
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

export function SortableActivityCard(props: SortableActivityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ActivityCard {...props} dragHandleProps={listeners} />
    </div>
  );
}