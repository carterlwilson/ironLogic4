import { Stack, Paper, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { BlockItem } from './BlockItem';
import { addBlock } from '../../../utils/programHelpers';
import type { IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { ActivityGroup } from '@ironlogic4/shared/types/activityGroups';

interface BlockListProps {
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  activityGroups: ActivityGroup[];
}

export function BlockList({ program, onProgramChange, templateMap, templates, activityGroups }: BlockListProps) {
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
      {[...program.blocks]
        .sort((a, b) => a.order - b.order)
        .map((block) => {
          const isCurrentBlock = block.order === program.currentProgress.blockIndex;
          return (
            <BlockItem
              key={block.id}
              block={block}
              program={program}
              onProgramChange={onProgramChange}
              templateMap={templateMap}
              templates={templates}
              activityGroups={activityGroups}
              isCurrentBlock={isCurrentBlock}
            />
          );
        })}

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