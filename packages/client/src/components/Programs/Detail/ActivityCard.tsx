import { useState } from 'react';
import { Paper, Group, Text, Badge, Stack, Menu, ActionIcon } from '@mantine/core';
import { IconEdit, IconTrash, IconCopy, IconDots, IconGripVertical } from '@tabler/icons-react';
import { ActivityType } from '@ironlogic4/shared/types/activityTemplates';
import { ActivityFormModal } from './ActivityFormModal';
import { deleteActivity, updateActivity, copyActivity } from '../../../utils/programHelpers';
import type { IActivity, IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';

interface ActivityCardProps {
  activity: IActivity;
  dayId: string;
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  templateMap: Record<string, ActivityTemplate>;
  templates: ActivityTemplate[];
  dragHandleProps?: any;
}

export function ActivityCard({ activity, program, onProgramChange, templateMap, templates, dragHandleProps }: ActivityCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (updatedActivity: Omit<IActivity, 'id' | 'order'>) => {
    const updated = updateActivity(program, activity.id, (a) => {
      Object.assign(a, updatedActivity);
    });
    onProgramChange(updated);
  };

  const handleDelete = () => {
    if (confirm('Delete this activity?')) {
      const updated = deleteActivity(program, activity.id);
      onProgramChange(updated);
    }
  };

  const handleCopy = () => {
    const updated = copyActivity(program, activity.id);
    onProgramChange(updated);
  };

  // Get activity type color
  const getTypeColor = (type: ActivityType) => {
    switch (type) {
      case ActivityType.LIFT:
        return 'blue';
      case ActivityType.CARDIO:
        return 'green';
      case ActivityType.BENCHMARK:
        return 'orange';
      case ActivityType.OTHER:
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Format activity details
  const getActivityDetails = () => {
    const details: string[] = [];

    // Handle sets array (for lift activities)
    if (activity.sets && Array.isArray(activity.sets) && activity.sets.length > 0) {
      // Check if all sets have the same reps and percentage
      const firstSet = activity.sets[0];
      const allSameReps = activity.sets.every(set => set.reps === firstSet.reps);
      const allSamePercentage = activity.sets.every(set => set.percentageOfMax === firstSet.percentageOfMax);

      if (allSameReps && allSamePercentage) {
        // Simple format: "3x5 @ 70%"
        details.push(`${activity.sets.length}x${firstSet.reps}`);
        if (firstSet.percentageOfMax > 0) {
          details.push(`@ ${firstSet.percentageOfMax}%`);
        }
      } else if (allSameReps) {
        // Same reps but different percentages: "3x5 @ 70-80%"
        const percentages = activity.sets.map(set => set.percentageOfMax).filter(p => p > 0);
        if (percentages.length > 0) {
          const minPercentage = Math.min(...percentages);
          const maxPercentage = Math.max(...percentages);
          details.push(`${activity.sets.length}x${firstSet.reps}`);
          if (minPercentage === maxPercentage) {
            details.push(`@ ${minPercentage}%`);
          } else {
            details.push(`@ ${minPercentage}-${maxPercentage}%`);
          }
        } else {
          details.push(`${activity.sets.length}x${firstSet.reps}`);
        }
      } else {
        // Different reps: show as list "5, 5, 3, 1 reps"
        const repsList = activity.sets.map(set => set.reps).join(', ');
        details.push(`${repsList} reps`);

        // Show percentage range if present
        const percentages = activity.sets.map(set => set.percentageOfMax).filter(p => p > 0);
        if (percentages.length > 0) {
          const minPercentage = Math.min(...percentages);
          const maxPercentage = Math.max(...percentages);
          if (minPercentage === maxPercentage) {
            details.push(`@ ${minPercentage}%`);
          } else {
            details.push(`@ ${minPercentage}-${maxPercentage}%`);
          }
        }
      }
    }

    if (activity.time) {
      details.push(`${activity.time} min`);
    }

    if (activity.distance) {
      details.push(`${activity.distance} ${activity.distanceUnit || 'units'}`);
    }

    return details.join(' • ');
  };

  return (
    <>
      <Paper
        withBorder
        p="xs"
        style={{
          borderLeft: '1px solid #f1f3f5',
        }}
      >
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <ActionIcon
            variant="subtle"
            size="xs"
            style={{ cursor: 'grab' }}
            data-activity-drag-handle
            {...dragHandleProps}
          >
            <IconGripVertical size={12} />
          </ActionIcon>

          <Stack gap={4} style={{ flex: 1 }}>
            <Group gap="xs">
              <Badge size="xs" color={getTypeColor(activity.type)}>
                {activity.type}
              </Badge>
              <Text size="sm" fw={500}>
                {templateMap[activity.activityTemplateId]?.name || 'Unknown Activity'}
              </Text>
            </Group>
            {getActivityDetails() && (
              <Text size="xs" c="dimmed">
                {getActivityDetails()}
              </Text>
            )}
          </Stack>

          <Menu withinPortal position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="xs">
                <IconDots size={10} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={10} />} onClick={() => setIsEditModalOpen(true)}>
                Edit Activity
              </Menu.Item>
              <Menu.Item leftSection={<IconCopy size={10} />} onClick={handleCopy}>
                Copy Activity
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={10} />} color="red" onClick={handleDelete}>
                Delete Activity
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Paper>

      <ActivityFormModal
        opened={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEdit}
        existingActivity={activity}
        templates={templates}
      />
    </>
  );
}