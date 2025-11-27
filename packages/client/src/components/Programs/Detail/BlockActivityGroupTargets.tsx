import { useState } from 'react';
import { Stack, Button, Text, Paper } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { ActivityGroupTargetRow } from './ActivityGroupTargetRow';
import { ActivityGroupTargetModal } from './ActivityGroupTargetModal';
import { updateBlock } from '../../../utils/programHelpers';
import { getBlockVolumeStatuses } from '../../../utils/volumeCalculations';
import type { IBlock, IProgram, IActivityGroupTarget } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { ActivityGroupOption } from '../../../hooks/useActivityGroupOptions';

interface BlockActivityGroupTargetsProps {
  block: IBlock;
  program: IProgram;
  onProgramChange: (program: IProgram) => void;
  activityTemplates: ActivityTemplate[];
  groupOptions: ActivityGroupOption[];
}

export function BlockActivityGroupTargets({
  block,
  program,
  onProgramChange,
  activityTemplates,
  groupOptions,
}: BlockActivityGroupTargetsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ target: IActivityGroupTarget; index: number } | null>(null);

  // Calculate volume statuses for all targets
  const volumeStatuses = getBlockVolumeStatuses(block, activityTemplates);

  const handleAddTarget = (target: Omit<IActivityGroupTarget, 'id'>) => {
    const updated = updateBlock(program, block.id, (b) => {
      b.activityGroupTargets.push(target as IActivityGroupTarget);
    });
    onProgramChange(updated);
  };

  const handleEditTarget = (target: Omit<IActivityGroupTarget, 'id'>) => {
    if (!editingTarget) return;

    const updated = updateBlock(program, block.id, (b) => {
      b.activityGroupTargets[editingTarget.index] = {
        ...editingTarget.target,
        targetPercentage: target.targetPercentage,
      };
    });
    onProgramChange(updated);
  };

  const handleDeleteTarget = (index: number) => {
    if (confirm('Delete this activity group target?')) {
      const updated = updateBlock(program, block.id, (b) => {
        b.activityGroupTargets.splice(index, 1);
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
  const existingGroupIds = block.activityGroupTargets.map(t => t.activityGroupId);

  if (block.activityGroupTargets.length === 0) {
    return (
      <>
        <Paper withBorder p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <Stack align="center" gap="sm">
            <Text size="sm" c="dimmed">
              No activity group targets set for this block
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
        {block.activityGroupTargets.map((target, index) => (
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