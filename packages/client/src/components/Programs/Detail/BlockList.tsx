import { Stack, Paper, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
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
import { SortableBlockItem } from './SortableBlockItem';
import { addBlock, reorderBlocks } from '../../../utils/programHelpers';
import type { IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ActivityGroupOption } from '../../../hooks/useActivityGroupOptions';

interface BlockListProps {
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
}

export function BlockList({ program, onProgramChange, onProgramChangeWithAutoSave, expandedIds, toggleExpanded, templateMap, templates, groupOptions, benchmarkTemplates, weightBenchmarkOptions, distanceBenchmarkOptions, timeBenchmarkOptions }: BlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sortedBlocks = [...program.blocks].sort((a, b) => a.order - b.order);
      const oldIndex = sortedBlocks.findIndex(b => b.id === active.id);
      const newIndex = sortedBlocks.findIndex(b => b.id === over.id);

      const reorderedBlocks = arrayMove(sortedBlocks, oldIndex, newIndex);
      const updated = reorderBlocks(program, reorderedBlocks);

      if (onProgramChangeWithAutoSave) {
        onProgramChangeWithAutoSave(updated);
      } else {
        onProgramChange(updated);
      }
    }
  };

  const handleAddBlock = () => {
    const updated = addBlock(program, {
      name: `Block ${program.blocks.length + 1}`,
      activityGroupTargets: [],
      weeks: [],
    });
    onProgramChange(updated);
  };

  if (program.blocks.length === 0) {
    return (
      <Paper withBorder p="xl">
        <Stack align="center" gap="md">
          <Text ta="center" c="dimmed">
            No blocks yet. Add a block to get started.
          </Text>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAddBlock}>
            Add Block
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="lg">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={program.blocks} strategy={verticalListSortingStrategy}>
          {[...program.blocks]
            .sort((a, b) => a.order - b.order)
            .map((block) => {
              const isCurrentBlock = block.order === program.currentProgress.blockIndex;
              return (
                <SortableBlockItem
                  key={block.id}
                  block={block}
                  program={program}
                  onProgramChange={onProgramChange}
                  onProgramChangeWithAutoSave={onProgramChangeWithAutoSave}
                  isExpanded={expandedIds.has(block.id)}
                  onToggleExpanded={() => toggleExpanded(block.id)}
                  expandedIds={expandedIds}
                  toggleExpanded={toggleExpanded}
                  templateMap={templateMap}
                  templates={templates}
                  groupOptions={groupOptions}
                  benchmarkTemplates={benchmarkTemplates}
                  weightBenchmarkOptions={weightBenchmarkOptions}
                  distanceBenchmarkOptions={distanceBenchmarkOptions}
                  timeBenchmarkOptions={timeBenchmarkOptions}
                  isCurrentBlock={isCurrentBlock}
                />
              );
            })}
        </SortableContext>
      </DndContext>

      <Button
        leftSection={<IconPlus size={16} />}
        onClick={handleAddBlock}
        variant="light"
        fullWidth
      >
        Add Another Block
      </Button>
    </Stack>
  );
}