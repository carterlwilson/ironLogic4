import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Stack, Text, Group, Button, ActionIcon, Badge, Paper, SegmentedControl } from '@mantine/core';
import { IconCheck, IconWeight, IconAlertCircle, IconBarbell, IconPlus, IconTrophy } from '@tabler/icons-react';
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
  const navigate = useNavigate();
  const [selectedSetIndex, setSelectedSetIndex] = useState(0);
  const [weightAdjustment, setWeightAdjustment] = useState(0);
  const [addBenchmarkModalOpened, setAddBenchmarkModalOpened] = useState(false);

  const anySetsComplete = progress.sets.some(s => s.completed);

  // Get the current set data
  const currentSet: ISetCalculation | undefined = activity.setCalculations?.[selectedSetIndex];
  const totalSets = activity.setCalculations?.length || 0;

  const getAdjustedWeight = (base: number) =>
    Math.round(base * (1 + weightAdjustment * 0.03) * 10) / 10;

  // Initialize barbell calculator hook with current set's weight
  const {
    calculation,
    barType,
    setBarType,
    isOpen,
    open,
    close,
  } = useBarbellCalculator(getAdjustedWeight(currentSet?.calculatedWeightKg || 0));

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
          <Group gap="xs">
            {weightAdjustment !== 0 && (
              <Badge
                color={weightAdjustment > 0 ? 'green' : 'red'}
                variant="filled"
                style={{ cursor: 'pointer' }}
                onClick={() => setWeightAdjustment(0)}
              >
                {weightAdjustment > 0 ? '+' : ''}{weightAdjustment * 3}%
              </Badge>
            )}
            {progress.completed && (
              <Badge color="green" variant="filled" size="lg">
                Complete
              </Badge>
            )}
          </Group>
        </Group>

        {/* Weight Adjustment Row — hidden for benchmark sets */}
        {currentSet?.calculatedWeightKg !== undefined && !currentSet.isBenchmarkSet && (
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">Adjust weight:</Text>
            <Group gap="xs">
              <Button
                variant="light"
                color="red"
                size="xs"
                onClick={() => setWeightAdjustment(w => w - 1)}
              >
                −3%
              </Button>
              <Button
                variant="light"
                color="forestGreen"
                size="xs"
                onClick={() => setWeightAdjustment(w => w + 1)}
              >
                +3%
              </Button>
            </Group>
          </Group>
        )}

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

        {/* Benchmark Set UI */}
        {currentSet?.isBenchmarkSet && (
          <Paper p="md" radius="md" withBorder bg="yellow.0">
            <Stack gap="sm">
              <Group gap="xs" align="center">
                <IconTrophy size={20} color="var(--mantine-color-yellow-7)" />
                <Text size="sm" fw={600} c="yellow.9">Go for a new max here.</Text>
              </Group>
              <Text size="sm">
                {currentSet.calculatedWeightKg !== undefined
                  ? `Add 3-5 kgs to your current max of ${currentSet.calculatedWeightKg} kg`
                  : 'No current max recorded yet.'}
              </Text>
              <Button
                variant="filled"
                color="yellow"
                size="md"
                leftSection={<IconTrophy size={16} />}
                onClick={() => navigate('/benchmarks', {
                  state: { benchmarkTemplateId: currentSet.benchmarkTemplateId },
                })}
                fullWidth
              >
                Set Max
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Normal Weight Information — hidden for benchmark sets */}
        {currentSet?.calculatedWeightKg !== undefined && !currentSet.isBenchmarkSet && (
          <Paper p="md" radius="md" withBorder bg="white">
            <Stack gap="sm">
              <Group gap="xs" align="center">
                <IconWeight size={20} style={{ opacity: 0.6 }} />
                <div style={{ flex: 1 }}>
                  <Text size="sm" c="dimmed">
                    {totalSets > 1 && `Set ${selectedSetIndex + 1}`}
                  </Text>
                  <Text size="xl" fw={700} c="forestGreen">
                    {currentSet.reps ? `${currentSet.reps} reps @ ` : ''}{getAdjustedWeight(currentSet.calculatedWeightKg)} kg
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

        {currentSet && currentSet.calculatedWeightKg === undefined && currentSet.percentageOfMax !== undefined && !currentSet.isBenchmarkSet && (
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
                Add Benchmark{currentSet.repMaxName ? ` — ${currentSet.repMaxName} needed` : ''}
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