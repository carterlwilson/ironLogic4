import { Card, Stack, Group, Badge, NumberInput, TextInput, Text } from '@mantine/core';
import { IconWeight, IconCalendar } from '@tabler/icons-react';
import { RepMax } from '@ironlogic4/shared/types/clientBenchmarks';
import { formatDateForInput, getRepMaxAgeInDays } from '../../utils/benchmarkUtils';

interface RepMaxEditCardProps {
  repMax: RepMax;
  templateRepMaxName: string;
  weightValue: number | string;
  dateValue: string;
  onWeightChange: (value: number | string) => void;
  onDateChange: (value: string) => void;
}

export function RepMaxEditCard({
  repMax,
  templateRepMaxName,
  weightValue,
  dateValue,
  onWeightChange,
  onDateChange,
}: RepMaxEditCardProps) {
  const ageInDays = getRepMaxAgeInDays(repMax);

  return (
    <Card padding="md" withBorder shadow="xs">
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Badge color="forestGreen" variant="light" size="lg">
            {templateRepMaxName}
          </Badge>
          <Text size="xs" c="dimmed">
            {ageInDays} day{ageInDays !== 1 ? 's' : ''} ago
          </Text>
        </Group>

        {/* Weight Input */}
        <NumberInput
          label="Weight"
          placeholder="Enter weight"
          value={weightValue}
          onChange={onWeightChange}
          min={0}
          step={0.5}
          decimalScale={1}
          suffix=" kg"
          size="md"
          leftSection={<IconWeight size={18} />}
        />

        {/* Date Input */}
        <TextInput
          label="Date Recorded"
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          max={formatDateForInput(new Date())}
          size="md"
          leftSection={<IconCalendar size={18} />}
        />
      </Stack>
    </Card>
  );
}
