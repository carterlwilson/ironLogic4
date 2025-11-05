import { Paper, Stack, Group, Text, Box, Badge, Divider } from '@mantine/core';
import { BarbellCalculation } from '../../../types/barbell';

interface PlateBreakdownProps {
  calculation: BarbellCalculation;
}

/**
 * Displays a breakdown of plates needed for the barbell
 *
 * Shows:
 * - Color-coded plate indicators
 * - Plate weights and labels
 * - Quantity per side
 * - Total plate count
 */
export function PlateBreakdown({ calculation }: PlateBreakdownProps) {
  if (calculation.plates.length === 0) {
    return (
      <Paper p="md" radius="md" withBorder>
        <Text size="sm" c="dimmed" ta="center">
          No plates needed - just the bar!
        </Text>
      </Paper>
    );
  }

  const totalPlates = calculation.plates.reduce((sum, plate) => sum + plate.quantity, 0);

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Text size="sm" fw={600} c="dimmed">
          Plates per Side
        </Text>

        <Stack gap="xs">
          {calculation.plates.map((plate, index) => (
            <Group key={index} justify="space-between" align="center">
              <Group gap="sm">
                <Box
                  w={24}
                  h={24}
                  style={{
                    backgroundColor: plate.color,
                    border: plate.color === '#FFFFFF' ? '1px solid #E5E7EB' : 'none',
                    borderRadius: '4px',
                  }}
                />
                <Text size="sm" fw={500}>
                  {plate.label}
                </Text>
              </Group>
              <Badge color="forestGreen" variant="filled" size="lg">
                {plate.quantity}×
              </Badge>
            </Group>
          ))}
        </Stack>

        <Divider />

        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Total plates per side
          </Text>
          <Badge color="gray" variant="light" size="lg">
            {totalPlates}
          </Badge>
        </Group>
      </Stack>
    </Paper>
  );
}
