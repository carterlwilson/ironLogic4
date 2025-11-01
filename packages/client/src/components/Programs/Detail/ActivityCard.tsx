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

    if (activity.sets && activity.reps) {
      details.push(`${activity.sets}x${activity.reps}`);
    } else if (activity.sets) {
      details.push(`${activity.sets} sets`);
    } else if (activity.reps) {
      details.push(`${activity.reps} reps`);
    }

    if (activity.percentageOfMax) {
      details.push(`@ ${activity.percentageOfMax}%`);
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