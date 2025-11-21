import { useState } from 'react';
import { Card, Stack, Text, Group, Button, ActionIcon, Badge, Paper, SegmentedControl } from '@mantine/core';
import { IconCheck, IconWeight, IconAlertCircle, IconBarbell, IconPlus } from '@tabler/icons-react';
import { ActivityProgress } from '../../pages/WorkoutPage';
import { useBarbellCalculator } from './barbell-calculator/useBarbellCalculator';
import { BarbellCalculatorDrawer } from './barbell-calculator/BarbellCalculatorDrawer';
import { AddBenchmarkModal } from './AddBenchmarkModal';
import type { WorkoutActivity, ISetCalculation } from '@ironlogic4/shared/types/programs';

interface LiftActivityCardProps {
  activity: WorkoutActivity;
  progress: ActivityProgress;
  onSetComplete: (activityId: string, setIndex: number) => void;
  onActivityComplete: (activityId: string) => void;
  onDataRefresh?: () => void;
}

export function LiftActivityCard({
  activity,
  progress,
  onSetComplete,
  onDataRefresh,
}: LiftActivityCardProps) {
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);
  const [addBenchmarkModalOpened, setAddBenchmarkModalOpened] = useState(false);

  const anySetsComplete = progress.sets.some(s => s.completed);

  // Get the current set data
  const currentSet: ISetCalculation | undefined = activity.setCalculations?.[selectedSetIndex];
  const totalSets = activity.setCalculations?.length || 0;

  // Initialize barbell calculator hook with current set's weight
  const {
    calculation,
    barType,
    setBarType,
    isOpen,
    open,
    close,
  } = useBarbellCalculator(currentSet?.calculatedWeightKg || 0);

  const getCardColor = () => {
    if (progress.completed) return 'green.0';
    if (anySetsComplete) return 'forestGreen.0';
    return undefined;
  };

  const handleCompleteCurrentSet = () => {
    // Mark current set as complete
    onSetComplete(activity.id, selectedSetIndex);

    // Auto-advance to next set if not on last set
    if (selectedSetIndex < totalSets - 1) {
      setSelectedSetIndex(selectedSetIndex + 1);
    }
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      bg={getCardColor()}
    >
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text fw={600} size="lg">
              {activity.templateName}
            </Text>
          </div>
          {progress.completed && (
            <Badge color="green" variant="filled" size="lg">
              Complete
            </Badge>
          )}
        </Group>

        {/* Set Selector - only show if multiple sets */}
        {totalSets > 1 && (
          <div>
            <Text size="sm" c="dimmed" mb="xs">
              Select Set
            </Text>
            <SegmentedControl
              value={selectedSetIndex.toString()}
              onChange={(value) => setSelectedSetIndex(parseInt(value))}
              data={Array.from({ length: totalSets }, (_, i) => ({
                label: `${i + 1}`,
                value: i.toString(),
              }))}
              fullWidth
              size="md"
            />
          </div>
        )}

        {/* Weight Information */}
        {currentSet?.calculatedWeightKg !== undefined && (
          <Paper p="md" radius="md" withBorder bg="white">
            <Stack gap="sm">
              <Group gap="xs" align="center">
                <IconWeight size={20} style={{ opacity: 0.6 }} />
                <div style={{ flex: 1 }}>
                  <Text size="sm" c="dimmed">
                    {totalSets > 1 && `Set ${selectedSetIndex + 1}`}
                  </Text>
                  <Text size="xl" fw={700} c="forestGreen">
                    {currentSet.reps ? `${currentSet.reps} reps @ ` : ''}{currentSet.calculatedWeightKg} kg
                  </Text>
                  {currentSet.percentageOfMax && currentSet.benchmarkName && (
                    <Text size="xs" c="dimmed">
                      {currentSet.percentageOfMax}% of {currentSet.benchmarkName}
                    </Text>
                  )}
                </div>
              </Group>

              {/* Plate Calculator Button */}
              <Button
                variant="light"
                color="forestGreen"
                size="lg"
                leftSection={<IconBarbell size={20} />}
                onClick={open}
                fullWidth
              >
                Plate Calculator
              </Button>
            </Stack>
          </Paper>
        )}

        {currentSet && currentSet.calculatedWeightKg === undefined && currentSet.percentageOfMax !== undefined && (
          <Paper p="md" radius="md" withBorder bg="orange.0">
            <Stack gap="sm">
              <Group gap="xs">
                <IconAlertCircle size={18} color="var(--mantine-color-orange-7)" />
                <Text size="sm" c="orange.9">
                  No benchmark set for {currentSet.benchmarkName || 'this exercise'}
                </Text>
              </Group>
              <Button
                variant="filled"
                color="orange"
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={() => setAddBenchmarkModalOpened(true)}
                fullWidth
              >
                Add Benchmark
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Complete Set Button */}
        <Button
          variant="filled"
          color={progress.sets[selectedSetIndex]?.completed ? 'gray' : 'forestGreen'}
          size="lg"
          leftSection={<IconCheck size={20} />}
          onClick={handleCompleteCurrentSet}
          fullWidth
          disabled={progress.sets[selectedSetIndex]?.completed}
        >
          {progress.sets[selectedSetIndex]?.completed
            ? `Set ${selectedSetIndex + 1} Complete`
            : `Complete Set ${selectedSetIndex + 1}`}
        </Button>

        {/* Set Progress Tracker */}
        {totalSets > 0 && (
          <div>
            <Text size="sm" c="dimmed" mb="xs">
              Set Progress
            </Text>
            <Group gap="xs">
              {Array.from({ length: totalSets }, (_, i) => {
                const setCalc = activity.setCalculations?.[i];
                return (
                  <ActionIcon
                    key={i}
                    size={44}
                    radius="xl"
                    variant={progress.sets[i]?.completed ? 'filled' : 'outline'}
                    color={progress.sets[i]?.completed ? 'green' : 'gray'}
                    onClick={() => onSetComplete(activity.id, i)}
                    title={setCalc ? `Set ${i + 1}: ${setCalc.reps} reps` : `Set ${i + 1}`}
                  >
                    {progress.sets[i]?.completed ? (
                      <IconCheck size={20} />
                    ) : (
                      <Text size="sm" fw={600}>{i + 1}</Text>
                    )}
                  </ActionIcon>
                );
              })}
            </Group>
          </div>
        )}
      </Stack>

      {/* Barbell Calculator Drawer */}
      <BarbellCalculatorDrawer
        opened={isOpen}
        onClose={close}
        calculation={calculation}
        barType={barType}
        onBarTypeChange={setBarType}
      />

      {/* Add Benchmark Modal */}
      {currentSet?.benchmarkTemplateId && currentSet?.benchmarkName && (
        <AddBenchmarkModal
          opened={addBenchmarkModalOpened}
          onClose={() => setAddBenchmarkModalOpened(false)}
          benchmarkTemplateId={currentSet.benchmarkTemplateId}
          benchmarkName={currentSet.benchmarkName}
          onSuccess={() => {
            setAddBenchmarkModalOpened(false);
            onDataRefresh?.();
          }}
        />
      )}
    </Card>
  );
}