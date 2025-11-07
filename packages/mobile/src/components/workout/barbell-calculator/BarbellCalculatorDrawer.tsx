import { Drawer, Stack, Text, Group, SegmentedControl, Alert, Box } from '@mantine/core';
import { IconAlertCircle, IconBarbell } from '@tabler/icons-react';
import { BarbellCalculation } from '../../../types/barbell';
import { BarType } from './useBarbellCalculator';
import { BarbellVisual } from './BarbellVisual';
import { PlateBreakdown } from './PlateBreakdown';

interface BarbellCalculatorDrawerProps {
  opened: boolean;
  onClose: () => void;
  calculation: BarbellCalculation;
  barType: BarType;
  onBarTypeChange: (type: BarType) => void;
}

/**
 * Main drawer component for the barbell plate calculator
 *
 * Displays:
 * - Target weight
 * - Bar type selector (Standard 20kg / Women's 15kg)
 * - Achieved weight with success/warning styling
 * - Rounding alert if weight was rounded
 * - Visual barbell representation
 * - Plate breakdown table
 */
export function BarbellCalculatorDrawer({
  opened,
  onClose,
  calculation,
  barType,
  onBarTypeChange,
}: BarbellCalculatorDrawerProps) {
  const weightDifference = Math.abs(calculation.achievedWeight - calculation.targetWeight);
  const hasRounding = !calculation.isExact;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      title={
        <Group gap="xs">
          <IconBarbell size={24} />
          <Text fw={600} size="lg">
            Plate Calculator
          </Text>
        </Group>
      }
      styles={{
        body: { paddingBottom: '2rem' },
      }}
    >
      <Stack gap="lg">
        {/* Target Weight */}
        <Box>
          <Text size="sm" c="dimmed" mb={4}>
            Target Weight
          </Text>
          <Text size="xl" fw={700}>
            {calculation.targetWeight} kg
          </Text>
        </Box>

        {/* Bar Type Selector */}
        <Box>
          <Text size="sm" c="dimmed" mb="xs">
            Bar Type
          </Text>
          <SegmentedControl
            value={barType}
            onChange={(value) => onBarTypeChange(value as BarType)}
            data={[
              { label: '20kg', value: 'standard' },
              { label: "15kg", value: 'womens' },
            ]}
            size="lg"
            fullWidth
            color="forestGreen"
          />
        </Box>

        {/* Achieved Weight */}
        <Box>
          <Text size="sm" c="dimmed" mb={4}>
            Achieved Weight
          </Text>
          <Text
            size="xl"
            fw={700}
            c={hasRounding ? 'orange.7' : 'green.7'}
          >
            {calculation.achievedWeight} kg
          </Text>
          {weightDifference > 0 && (
            <Text size="xs" c="dimmed">
              ({weightDifference > 0 ? '+' : ''}{(calculation.achievedWeight - calculation.targetWeight).toFixed(2)} kg)
            </Text>
          )}
        </Box>

        {/* Rounding Alert */}
        {hasRounding && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="orange"
            variant="light"
          >
            <Text size="sm">
              Weight rounded to nearest 1.25kg based on available plates
            </Text>
          </Alert>
        )}

        {/* Barbell Visual */}
        <BarbellVisual calculation={calculation} />

        {/* Plate Breakdown */}
        <PlateBreakdown calculation={calculation} />
      </Stack>
    </Drawer>
  );
}
