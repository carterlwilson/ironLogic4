import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockItem } from './BlockItem';
import type { IBlock, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ActivityGroupOption } from '../../../hooks/useActivityGroupOptions';

interface SortableBlockItemProps {
  block: IBlock;
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  onProgramChangeWithAutoSave?: (program: IProgram) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
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

export function SortableBlockItem(props: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <BlockItem {...props} dragHandleProps={listeners} />
    </div>
  );
}
