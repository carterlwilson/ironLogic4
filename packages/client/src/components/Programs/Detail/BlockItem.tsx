import { useState } from 'react';
import { Paper, Stack, Group, Text, ActionIcon, Collapse, Badge, TextInput, Button, Menu } from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconEdit, IconTrash, IconPlus, IconCopy, IconDots } from '@tabler/icons-react';
import { WeekList } from './WeekList';
import { BlockActivityGroupTargets } from './BlockActivityGroupTargets';
import { addWeek, deleteBlock, updateBlock, copyBlock } from '../../../utils/programHelpers';
import type { IBlock, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { ActivityGroupOption } from '../../../hooks/useActivityGroupOptions';

interface BlockItemProps {
  block: IBlock;
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  groupOptions: ActivityGroupOption[];
  isCurrentBlock?: boolean;
}

export function BlockItem({ block, program, onProgramChange, templateMap, templates, groupOptions, isCurrentBlock }: BlockItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.name);

  const handleSaveName = () => {
    if (editValue.trim()) {
      const updated = updateBlock(program, block.id, (b) => {
        b.name = editValue.trim();
      });
      onProgramChange(updated);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditValue(block.name);
    setIsEditing(false);
  };

  const handleAddWeek = () => {
    const updated = addWeek(program, block.id, {
      name: `Week ${block.weeks.length + 1}`,
      activityGroupTargets: [],
      days: [],
    });
    onProgramChange(updated);
  };

  const handleDelete = () => {
    if (confirm(`Delete block "${block.name}"? This will delete all weeks, days, and activities.`)) {
      const updated = deleteBlock(program, block.id);
      onProgramChange(updated);
    }
  };

  const handleCopy = () => {
    const updated = copyBlock(program, block.id);
    onProgramChange(updated);
  };

  return (
    <Paper
      withBorder
      p="md"
      style={{
        borderLeft: '2px solid #228be6',
        borderLeftWidth: 2,
      }}
    >
      <Stack gap="md">
        {/* Block Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" style={{ flex: 1 }}>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </ActionIcon>
            {isEditing ? (
              <Group gap="xs">
                <TextInput
                  value={editValue}
                  onChange={(e) => setEditValue(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  size="sm"
                  style={{ width: 200 }}
                  autoFocus
                />
                <Button size="xs" onClick={handleSaveName}>Save</Button>
                <Button size="xs" variant="subtle" onClick={handleCancelEdit}>Cancel</Button>
              </Group>
            ) : (
              <>
                <Text fw={600} size="lg">
                  {block.name}
                </Text>
                <ActionIcon variant="subtle" size="sm" onClick={() => setIsEditing(true)}>
                  <IconEdit size={14} />
                </ActionIcon>
              </>
            )}
            <Badge size="sm" variant="light">
              {block.weeks.length} {block.weeks.length === 1 ? 'week' : 'weeks'}
            </Badge>
            {isCurrentBlock && (
              <Badge size="sm" color="forestGreen">
                CURRENT
              </Badge>
            )}
          </Group>

          <Menu withinPortal position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconPlus size={14} />} onClick={handleAddWeek}>
                Add Week
              </Menu.Item>
              <Menu.Item leftSection={<IconCopy size={14} />} onClick={handleCopy}>
                Copy Block
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={handleDelete}>
                Delete Block
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Week List */}
        <Collapse in={isExpanded}>
          <Stack gap="md">
            {/* Activity Group Targets - moved inside */}
            <BlockActivityGroupTargets
              block={block}
              program={program}
              onProgramChange={onProgramChange}
              activityTemplates={templates}
              groupOptions={groupOptions}
            />

            {/* Week List */}
            <div style={{ paddingLeft: 20 }}>
              <WeekList
                blockId={block.id}
                weeks={block.weeks}
                program={program}
                onProgramChange={onProgramChange}
                templateMap={templateMap}
                templates={templates}
                groupOptions={groupOptions}
                isCurrentBlock={isCurrentBlock}
              />
            </div>

            {/* Add Week Button */}
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={handleAddWeek}
              fullWidth
            >
              Add Week
            </Button>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}