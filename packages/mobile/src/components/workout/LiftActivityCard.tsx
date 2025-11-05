import { Card, Stack, Text, Group, Button, ActionIcon, Badge, Paper } from '@mantine/core';
import { IconCheck, IconWeight, IconAlertCircle, IconBarbell } from '@tabler/icons-react';
import { ActivityProgress } from '../../pages/WorkoutPage';
import { useBarbellCalculator } from './barbell-calculator/useBarbellCalculator';
import { BarbellCalculatorDrawer } from './barbell-calculator/BarbellCalculatorDrawer';

interface LiftActivity {
  id: string;
  templateName: string;
  sets?: number;
  reps?: number;
  percentageOfMax?: number;
  // New server fields for benchmark data
  calculatedWeightKg?: number;
  benchmarkWeightKg?: number;
  benchmarkName?: string;
  benchmarkTemplateId?: string;
}

interface LiftActivityCardProps {
  activity: LiftActivity;
  progress: ActivityProgress;
  onSetComplete: (activityId: string, setIndex: number) => void;
  onActivityComplete: (activityId: string) => void;
}

export function LiftActivityCard({
  activity,
  progress,
  onSetComplete,
  onActivityComplete,
}: LiftActivityCardProps) {
  const allSetsComplete = progress.sets.every(s => s.completed);
  const anySetsComplete = progress.sets.some(s => s.completed);

  // Initialize barbell calculator hook
  const {
    calculation,
    barType,
    setBarType,
    isOpen,
    open,
    close,
  } = useBarbellCalculator(activity.calculatedWeightKg || 0);

  const getCardColor = () => {
    if (progress.completed) return 'green.0';
    if (anySetsComplete) return 'forestGreen.0';
    return undefined;
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
            {activity.sets && activity.reps && (
              <Text size="sm" c="dimmed">
                {activity.sets} sets × {activity.reps} reps
              </Text>
            )}
          </div>
          {progress.completed && (
            <Badge color="green" variant="filled" size="lg">
              Complete
            </Badge>
          )}
        </Group>

        {/* Weight Information */}
        {activity.calculatedWeightKg !== undefined && (
          <Paper p="md" radius="md" withBorder bg="white">
            <Stack gap="sm">
              <Group gap="xs" align="center">
                <IconWeight size={20} style={{ opacity: 0.6 }} />
                <div style={{ flex: 1 }}>
                  <Text size="sm" c="dimmed">
                    Recommended Weight
                  </Text>
                  <Text size="xl" fw={700} c="forestGreen">
                    {activity.calculatedWeightKg} kg
                  </Text>
                  {activity.percentageOfMax && activity.benchmarkWeightKg !== undefined && (
                    <Text size="xs" c="dimmed">
                      {activity.percentageOfMax}% of {activity.benchmarkWeightKg} kg
                      {activity.benchmarkName && ` (${activity.benchmarkName})`}
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

        {activity.calculatedWeightKg === undefined && activity.percentageOfMax !== undefined && (
          <Paper p="sm" radius="md" withBorder bg="orange.0">
            <Group gap="xs">
              <IconAlertCircle size={18} color="var(--mantine-color-orange-7)" />
              <Text size="sm" c="orange.9">
                No benchmark set - update your benchmarks to see recommended weight
              </Text>
            </Group>
          </Paper>
        )}

        {/* Set Progress Tracker */}
        {activity.sets && activity.sets > 0 && (
          <div>
            <Text size="sm" c="dimmed" mb="xs">
              Set Progress
            </Text>
            <Group gap="xs">
              {Array.from({ length: activity.sets }, (_, i) => (
                <ActionIcon
                  key={i}
                  size={44}
                  radius="xl"
                  variant={progress.sets[i]?.completed ? 'filled' : 'outline'}
                  color={progress.sets[i]?.completed ? 'green' : 'gray'}
                  onClick={() => onSetComplete(activity.id, i)}
                >
                  {progress.sets[i]?.completed ? (
                    <IconCheck size={20} />
                  ) : (
                    <Text size="sm" fw={600}>{i + 1}</Text>
                  )}
                </ActionIcon>
              ))}
            </Group>
          </div>
        )}

        {/* Mark Complete Button */}
        <Button
          variant={progress.completed ? 'outline' : 'filled'}
          color={progress.completed ? 'gray' : allSetsComplete ? 'green' : 'forestGreen'}
          size="md"
          onClick={() => onActivityComplete(activity.id)}
          fullWidth
        >
          {progress.completed ? 'Mark Incomplete' : 'Mark Complete'}
        </Button>
      </Stack>

      {/* Barbell Calculator Drawer */}
      <BarbellCalculatorDrawer
        opened={isOpen}
        onClose={close}
        calculation={calculation}
        barType={barType}
        onBarTypeChange={setBarType}
      />
    </Card>
  );
}