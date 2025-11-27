import { useState } from 'react';
import { Stack, Button, Text, Paper } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { ActivityGroupTargetRow } from './ActivityGroupTargetRow';
import { ActivityGroupTargetModal } from './ActivityGroupTargetModal';
import { updateWeek } from '../../../utils/programHelpers';
import { getWeekVolumeStatuses } from '../../../utils/volumeCalculations';
import type { IWeek, IProgram, IActivityGroupTarget } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { ActivityGroupOption } from '../../../hooks/useActivityGroupOptions';

interface WeekActivityGroupTargetsProps {
  week: IWeek;
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  activityTemplates: ActivityTemplate[];
  groupOptions: ActivityGroupOption[];
}

export function WeekActivityGroupTargets({
  week,
  program,
  onProgramChange,
  activityTemplates,
  groupOptions,
}: WeekActivityGroupTargetsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ target: IActivityGroupTarget; index: number } | null>(null);

  // Calculate volume statuses for all targets
  const volumeStatuses = getWeekVolumeStatuses(week, activityTemplates);

  const handleAddTarget = (target: Omit<IActivityGroupTarget, 'id'>) => {
    const updated = updateWeek(program, week.id, (w) => {
      w.activityGroupTargets.push(target as IActivityGroupTarget);
    });
    onProgramChange(updated);
  };

  const handleEditTarget = (target: Omit<IActivityGroupTarget, 'id'>) => {
    if (!editingTarget) return;

    const updated = updateWeek(program, week.id, (w) => {
      w.activityGroupTargets[editingTarget.index] = {
        ...editingTarget.target,
        targetPercentage: target.targetPercentage,
      };
    });
    onProgramChange(updated);
  };

  const handleDeleteTarget = (index: number) => {
    if (confirm('Delete this activity group target?')) {
      const updated = updateWeek(program, week.id, (w) => {
        w.activityGroupTargets.splice(index, 1);
      });
      onProgramChange(updated);
    }
  };

  const handleOpenAddModal = () => {
    setEditingTarget(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (target: IActivityGroupTarget, index: number) => {
    setEditingTarget({ target, index });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTarget(null);
  };

  const handleSubmit = (target: Omit<IActivityGroupTarget, 'id'>) => {
    if (editingTarget) {
      handleEditTarget(target);
    } else {
      handleAddTarget(target);
    }
  };

  // Get activity group name by ID
  const getGroupName = (groupId: string) => {
    const option = groupOptions.find(opt => opt.value === groupId);
    return option?.label || 'Unknown Group';
  };

  // Get existing group IDs (for validation)
  const existingGroupIds = week.activityGroupTargets.map(t => t.activityGroupId);

  if (week.activityGroupTargets.length === 0) {
    return (
      <>
        <Paper withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <Stack align="center" gap="sm">
            <Text size="sm" c="dimmed">
              No activity group targets set for this week
            </Text>
            <Button
              leftSection={<IconPlus size={14} />}
              size="xs"
              variant="light"
              onClick={handleOpenAddModal}
            >
              Add Target
            </Button>
          </Stack>
        </Paper>

        <ActivityGroupTargetModal
          opened={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          existingTarget={editingTarget?.target}
          existingGroupIds={existingGroupIds}
          groupOptions={groupOptions}
        />
      </>
    );
  }

  return (
    <>
      <Stack gap="xs">
        {week.activityGroupTargets.map((target, index) => (
          <ActivityGroupTargetRow
            key={`${target.activityGroupId}-${index}`}
            groupName={getGroupName(target.activityGroupId)}
            targetPercentage={target.targetPercentage}
            volumeStatus={volumeStatuses.get(target.activityGroupId)}
            onEdit={() => handleOpenEditModal(target, index)}
            onDelete={() => handleDeleteTarget(index)}
          />
        ))}

        <Button
          leftSection={<IconPlus size={14} />}
          size="xs"
          variant="light"
          onClick={handleOpenAddModal}
          fullWidth
        >
          Add Target
        </Button>
      </Stack>

      <ActivityGroupTargetModal
        opened={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        existingTarget={editingTarget?.target}
        existingGroupIds={existingGroupIds}
        groupOptions={groupOptions}
      />
    </>
  );
}