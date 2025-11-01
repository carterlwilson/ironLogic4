import { useState } from 'react';
import { Stack, Paper, Group, Text, Badge, Collapse, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ClientBenchmark, BenchmarkType } from '@ironlogic4/shared';
import { BenchmarkProgressChart } from './BenchmarkProgressChart';

interface BenchmarkProgressListProps {
  currentBenchmarks: ClientBenchmark[];
}

interface BenchmarkTemplate {
  templateId: string;
  name: string;
  type: BenchmarkType;
}

const getBenchmarkTypeColor = (type: BenchmarkType): string => {
  switch (type) {
    case BenchmarkType.WEIGHT:
      return 'blue';
    case BenchmarkType.TIME:
      return 'green';
    case BenchmarkType.REPS:
      return 'orange';
    case BenchmarkType.OTHER:
      return 'gray';
    default:
      return 'gray';
  }
};

const getBenchmarkTypeLabel = (type: BenchmarkType): string => {
  switch (type) {
    case BenchmarkType.WEIGHT:
      return 'WEIGHT';
    case BenchmarkType.TIME:
      return 'TIME';
    case BenchmarkType.REPS:
      return 'REPS';
    case BenchmarkType.OTHER:
      return 'OTHER';
    default:
      return type;
  }
};

export const BenchmarkProgressList = ({ currentBenchmarks }: BenchmarkProgressListProps) => {
  const [openIndex, setOpenIndex] = useState<number>(0);

  // Extract unique templates from current benchmarks
  const uniqueTemplates: BenchmarkTemplate[] = [];
  const seenTemplateIds = new Set<string>();

  for (const benchmark of currentBenchmarks) {
    if (!seenTemplateIds.has(benchmark.templateId)) {
      seenTemplateIds.add(benchmark.templateId);
      uniqueTemplates.push({
        templateId: benchmark.templateId,
        name: benchmark.name,
        type: benchmark.type,
      });
    }
  }

  if (uniqueTemplates.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Text c="dimmed" ta="center">
          Create a current benchmark to view progress charts
        </Text>
      </Paper>
    );
  }

  const toggleSection = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <Stack gap="md">
      {uniqueTemplates.map((template, index) => {
        const isOpen = openIndex === index;

        return (
          <Paper key={template.templateId} withBorder>
            <Group
              p="md"
              justify="space-between"
              style={{ cursor: 'pointer' }}
              onClick={() => toggleSection(index)}
            >
              <Group gap="sm">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                >
                  {isOpen ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRight size={16} />
                  )}
                </ActionIcon>
                <Text fw={500}>{template.name}</Text>
              </Group>
              <Badge color={getBenchmarkTypeColor(template.type)} variant="light">
                {getBenchmarkTypeLabel(template.type)}
              </Badge>
            </Group>

            <Collapse in={isOpen}>
              <Paper p="md" pt={0}>
                <BenchmarkProgressChart
                  templateId={template.templateId}
                  benchmarkName={template.name}
                />
              </Paper>
            </Collapse>
          </Paper>
        );
      })}
    </Stack>
  );
};
