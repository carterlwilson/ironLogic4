import { useState, useEffect } from 'react';
import { Paper, Title, Stack, Group, Select, Button, Text } from '@mantine/core';
import { useAuth } from '../../../providers/AuthProvider';
import { useUpdateProgramProgress } from '../../../hooks/useProgramProgress';
import type { IProgram } from '@ironlogic4/shared/types/programs';

interface ProgramProgressControlProps {
  program: IProgram;
  onProgressUpdate?: () => void;
}

export function ProgramProgressControl({ program, onProgressUpdate }: ProgramProgressControlProps) {
  const { user } = useAuth();
  const updateProgressMutation = useUpdateProgramProgress();

  // Initialize state with current progress
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<string>(
    String(program.currentProgress.blockIndex)
  );
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<string>(
    String(program.currentProgress.weekIndex)
  );

  // Update local state when program changes
  useEffect(() => {
    setSelectedBlockIndex(String(program.currentProgress.blockIndex));
    setSelectedWeekIndex(String(program.currentProgress.weekIndex));
  }, [program.currentProgress.blockIndex, program.currentProgress.weekIndex]);

  // Permission check - only owners and coaches can see this
  if (user?.role !== 'owner' && user?.role !== 'coach') {
    return null;
  }

  // No blocks case
  if (!program.blocks || program.blocks.length === 0) {
    return (
      <Paper withBorder p="md">
        <Stack gap="md">
          <Title order={3}>Current Program Position</Title>
          <Text c="dimmed">Add blocks to the program before setting progress</Text>
        </Stack>
      </Paper>
    );
  }

  // Get block and week data for dropdowns
  const blockOptions = [...program.blocks]
    .sort((a, b) => a.order - b.order)
    .map((block) => ({
      value: String(block.order),
      label: block.name,
    }));

  const selectedBlock = program.blocks.find((b) => b.order === Number(selectedBlockIndex));
  const weekOptions = selectedBlock
    ? [...selectedBlock.weeks]
        .sort((a, b) => a.order - b.order)
        .map((week) => ({
          value: String(week.order),
          label: week.name,
        }))
    : [];

  // Get current block and week for display
  const currentBlock = program.blocks.find((b) => b.order === program.currentProgress.blockIndex);
  const currentWeek = currentBlock?.weeks.find((w) => w.order === program.currentProgress.weekIndex);

  // Check if selected values match current position
  const isUnchanged =
    Number(selectedBlockIndex) === program.currentProgress.blockIndex &&
    Number(selectedWeekIndex) === program.currentProgress.weekIndex;

  // Check if selected block has no weeks
  const hasNoWeeks = !selectedBlock || selectedBlock.weeks.length === 0;

  const handleBlockChange = (value: string | null) => {
    if (value !== null) {
      setSelectedBlockIndex(value);
      // Reset week to first week of new block
      const newBlock = program.blocks.find((b) => b.order === Number(value));
      if (newBlock && newBlock.weeks.length > 0) {
        const firstWeek = [...newBlock.weeks].sort((a, b) => a.order - b.order)[0];
        setSelectedWeekIndex(String(firstWeek.order));
      } else {
        setSelectedWeekIndex('0');
      }
    }
  };

  const handleWeekChange = (value: string | null) => {
    if (value !== null) {
      setSelectedWeekIndex(value);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateProgressMutation.mutateAsync({
        programId: program.id,
        blockIndex: Number(selectedBlockIndex),
        weekIndex: Number(selectedWeekIndex),
      });

      // Call the callback if provided
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      // Error already handled by mutation
    }
  };

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Title order={3}>Current Program Position</Title>

        {/* Current position display */}
        {currentBlock && currentWeek && (
          <Text c="dimmed" size="sm">
            Currently on: {currentBlock.name}, {currentWeek.name}
          </Text>
        )}

        {/* Block and Week selectors */}
        <Group align="flex-end" gap="md">
          <Select
            label="Block"
            data={blockOptions}
            value={selectedBlockIndex}
            onChange={handleBlockChange}
            style={{ flex: 1 }}
          />

          <Select
            label="Week"
            data={weekOptions}
            value={selectedWeekIndex}
            onChange={handleWeekChange}
            disabled={hasNoWeeks}
            style={{ flex: 1 }}
          />

          <Button
            onClick={handleUpdate}
            disabled={isUnchanged || hasNoWeeks}
            loading={updateProgressMutation.isPending}
            color="forestGreen"
          >
            Update Position
          </Button>
        </Group>

        {/* Show message if selected block has no weeks */}
        {hasNoWeeks && (
          <Text c="dimmed" size="sm">
            Selected block has no weeks
          </Text>
        )}
      </Stack>
    </Paper>
  );
}