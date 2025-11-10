import { useState } from 'react';
import { Paper, Stack, Group, Text, ActionIcon, Collapse, Badge, TextInput, Button, Menu } from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconEdit, IconTrash, IconPlus, IconCopy, IconDots } from '@tabler/icons-react';
import { ActivityList } from './ActivityList';
import { ActivityFormModal } from './ActivityFormModal';
import { addActivity, deleteDay, updateDay, copyDay } from '../../../utils/programHelpers';
import type { IDay, IProgram, IActivity } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';

interface DayItemProps {
  day: IDay;
  weekId: string;
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
}

export function DayItem({ day, program, onProgramChange, templateMap, templates }: DayItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(day.name);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const handleSaveName = () => {
    if (editValue.trim()) {
      const updated = updateDay(program, day.id, (d) => {
        d.name = editValue.trim();
      });
      onProgramChange(updated);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditValue(day.name);
    setIsEditing(false);
  };

  const handleAddActivity = (activity: Omit<IActivity, 'id' | 'order'>) => {
    const updated = addActivity(program, day.id, activity);
    onProgramChange(updated);
  };

  const handleDelete = () => {
    if (confirm(`Delete day "${day.name}"? This will delete all activities.`)) {
      const updated = deleteDay(program, day.id);
      onProgramChange(updated);
    }
  };

  const handleCopy = () => {
    const updated = copyDay(program, day.id);
    onProgramChange(updated);
  };

  return (
    <>
      <Paper
        withBorder
        p="md"
        style={{
          borderLeft: '1px solid #e9ecef',
        }}
      >
        <Stack gap="md">
          {/* Day Header */}
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
                    style={{ width: 160 }}
                    autoFocus
                  />
                  <Button size="xs" onClick={handleSaveName}>Save</Button>
                  <Button size="xs" variant="subtle" onClick={handleCancelEdit}>Cancel</Button>
                </Group>
              ) : (
                <>
                  <Text fw={500} size="sm">
                    {day.name}
                  </Text>
                  <ActionIcon variant="subtle" size="xs" onClick={() => setIsEditing(true)}>
                    <IconEdit size={10} />
                  </ActionIcon>
                </>
              )}
              <Badge size="xs" variant="light" color="gray">
                {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
              </Badge>
            </Group>

            <Menu withinPortal position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
                  <IconDots size={12} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconPlus size={10} />} onClick={() => setIsActivityModalOpen(true)}>
                  Add Activity
                </Menu.Item>
                <Menu.Item leftSection={<IconCopy size={10} />} onClick={handleCopy}>
                  Copy Day
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconTrash size={10} />} color="red" onClick={handleDelete}>
                  Delete Day
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          {/* Activity List */}
          <Collapse in={isExpanded}>
            <Stack gap="md">
              <div style={{ paddingLeft: 20 }}>
                <ActivityList
                  dayId={day.id}
                  activities={day.activities}
                  program={program}
                  onProgramChange={onProgramChange}
                  templateMap={templateMap}
                  templates={templates}
                />
              </div>

              {/* Add Activity Button */}
              <Button
                variant="light"
                size="sm"
                leftSection={<IconPlus size={14} />}
                onClick={() => setIsActivityModalOpen(true)}
                fullWidth
              >
                Add Activity
              </Button>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      <ActivityFormModal
        opened={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSubmit={handleAddActivity}
        templates={templates}
      />
    </>
  );
}