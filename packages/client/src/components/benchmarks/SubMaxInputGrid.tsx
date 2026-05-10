import { Stack, Text, NumberInput } from '@mantine/core';
import { BenchmarkType, DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import { IconWeight, IconRun, IconClock } from '@tabler/icons-react';

interface SubMaxInputGridProps {
  benchmarkType: BenchmarkType;
  fullTemplate: BenchmarkTemplate | undefined;
  loadingTemplate: boolean;
  repMaxValues: Record<string, number | string>;
  onRepMaxChange: (id: string, value: number | string) => void;
  timeSubMaxValues: Record<string, number | string>;
  onTimeSubMaxChange: (id: string, value: number | string) => void;
  distanceSubMaxValues: Record<string, number | string>;
  onDistanceSubMaxChange: (id: string, value: number | string) => void;
  error?: string;
}

export function SubMaxInputGrid({
  benchmarkType,
  fullTemplate,
  loadingTemplate,
  repMaxValues,
  onRepMaxChange,
  timeSubMaxValues,
  onTimeSubMaxChange,
  distanceSubMaxValues,
  onDistanceSubMaxChange,
  error,
}: SubMaxInputGridProps) {
  if (benchmarkType === BenchmarkType.WEIGHT) {
    if (loadingTemplate) return <Text size="sm" c="dimmed">Loading rep max options...</Text>;
    if (!fullTemplate?.templateRepMaxes?.length) return <Text size="sm" c="red">No rep max options available for this template</Text>;
    return (
      <Stack gap="md">
        <Text size="sm" fw={500}>Rep maxes</Text>
        {fullTemplate.templateRepMaxes
          .sort((a, b) => a.reps - b.reps)
          .map((trm) => (
            <NumberInput
              key={trm.id}
              label={`${trm.name} (${trm.reps} rep${trm.reps > 1 ? 's' : ''})`}
              placeholder="Weight in kg"
              value={repMaxValues[trm.id] || ''}
              onChange={(val) => onRepMaxChange(trm.id, val)}
              min={0}
              step={0.5}
              decimalScale={1}
              leftSection={<IconWeight size={16} />}
            />
          ))}
        {error && <Text size="sm" c="red">{error}</Text>}
      </Stack>
    );
  }

  if (benchmarkType === BenchmarkType.DISTANCE) {
    if (loadingTemplate) return <Text size="sm" c="dimmed">Loading distance intervals...</Text>;
    if (!fullTemplate?.templateTimeSubMaxes?.length) return <Text size="sm" c="red">No time intervals available for this template</Text>;
    return (
      <Stack gap="md">
        <Text size="sm" fw={500}>
          Distances covered for each time interval ({fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 'kilometers' : 'meters'})
        </Text>
        {fullTemplate.templateTimeSubMaxes.map((tsm) => (
          <NumberInput
            key={tsm.id}
            label={tsm.name}
            placeholder={`Distance in ${fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 'km' : 'm'}`}
            value={timeSubMaxValues[tsm.id] || ''}
            onChange={(val) => onTimeSubMaxChange(tsm.id, val)}
            min={0}
            step={fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 0.1 : 10}
            decimalScale={fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 2 : 0}
            leftSection={<IconRun size={16} />}
            description={`Distance covered in ${tsm.name}`}
          />
        ))}
      </Stack>
    );
  }

  if (benchmarkType === BenchmarkType.TIME) {
    if (loadingTemplate) return <Text size="sm" c="dimmed">Loading distance intervals...</Text>;
    if (!fullTemplate?.templateDistanceSubMaxes?.length) return null;
    return (
      <Stack gap="md">
        <Text size="sm" fw={500}>Time taken for each distance interval (in seconds)</Text>
        {fullTemplate.templateDistanceSubMaxes.map((dsm) => (
          <NumberInput
            key={dsm.id}
            label={dsm.name}
            placeholder="Time in seconds"
            value={distanceSubMaxValues[dsm.id] || ''}
            onChange={(val) => onDistanceSubMaxChange(dsm.id, val)}
            min={0}
            step={1}
            decimalScale={1}
            leftSection={<IconClock size={16} />}
            description={`Time to complete ${dsm.name}`}
          />
        ))}
      </Stack>
    );
  }

  return null;
}
