import { useState } from 'react';
import { Paper, Stack, Group, Text, ActionIcon, Collapse, Badge, TextInput, Button, Menu } from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconEdit, IconTrash, IconPlus, IconCopy, IconDots } from '@tabler/icons-react';
import { DayList } from './DayList';
import { WeekActivityGroupTargets } from './WeekActivityGroupTargets';
import { addDay, deleteWeek, updateWeek, copyWeek } from '../../../utils/programHelpers';
import type { IWeek, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { ActivityGroupOption } from '../../../hooks/useActivityGroupOptions';

interface WeekItemProps {
  week: IWeek;
  blockId: string;
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  groupOptions: ActivityGroupOption[];
  isCurrentWeek?: boolean;
}

export function WeekItem({ week, program, onProgramChange, templateMap, templates, groupOptions, isCurrentWeek }: WeekItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(week.name);

  const handleSaveName = () => {
    if (editValue.trim()) {
      const updated = updateWeek(program, week.id, (w) => {
        w.name = editValue.trim();
      });
      onProgramChange(updated);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditValue(week.name);
    setIsEditing(false);
  };

  const handleAddDay = () => {
    const updated = addDay(program, week.id, {
      name: `Day ${week.days.length + 1}`,
      activities: [],
    });
    onProgramChange(updated);
  };

  const handleDelete = () => {
    if (confirm(`Delete week "${week.name}"? This will delete all days and activities.`)) {
      const updated = deleteWeek(program, week.id);
      onProgramChange(updated);
    }
  };

  const handleCopy = () => {
    const updated = copyWeek(program, week.id);
    onProgramChange(updated);
  };

  return (
    <Paper
      withBorder
      p="md"
      style={{
        borderLeft: '1px solid #dee2e6',
      }}
    >
      <Stack gap="md">
        {/* Week Header */}
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
                  style={{ width: 180 }}
                  autoFocus
                />
                <Button size="xs" onClick={handleSaveName}>Save</Button>
                <Button size="xs" variant="subtle" onClick={handleCancelEdit}>Cancel</Button>
              </Group>
            ) : (
              <>
                <Text fw={500}>
                  {week.name}
                </Text>
                <ActionIcon variant="subtle" size="sm" onClick={() => setIsEditing(true)}>
                  <IconEdit size={12} />
                </ActionIcon>
              </>
            )}
            <Badge size="sm" variant="light" color="gray">
              {week.days.length} {week.days.length === 1 ? 'day' : 'days'}
            </Badge>
            {isCurrentWeek && (
              <Badge size="sm" color="forestGreen">
                CURRENT
              </Badge>
            )}
          </Group>

          <Menu withinPortal position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconPlus size={12} />} onClick={handleAddDay}>
                Add Day
              </Menu.Item>
              <Menu.Item leftSection={<IconCopy size={12} />} onClick={handleCopy}>
                Copy Week
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={12} />} color="red" onClick={handleDelete}>
                Delete Week
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Day List */}
        <Collapse in={isExpanded}>
          <Stack gap="md">
            {/* Activity Group Targets - new component */}
            <WeekActivityGroupTargets
              week={week}
              program={program}
              onProgramChange={onProgramChange}
              activityTemplates={templates}
              groupOptions={groupOptions}
            />

            {/* Day List */}
            <div style={{ paddingLeft: 20 }}>
              <DayList
                weekId={week.id}
                days={week.days}
                program={program}
                onProgramChange={onProgramChange}
                templateMap={templateMap}
                templates={templates}
              />
            </div>

            {/* Add Day Button */}
            <Button
              variant="light"
              size="sm"
              leftSection={<IconPlus size={14} />}
              onClick={handleAddDay}
              fullWidth
            >
              Add Day
            </Button>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}