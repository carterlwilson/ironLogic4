import { Card, Text, Group, Badge, Button, Stack, Paper, Collapse, ActionIcon, SimpleGrid, Skeleton } from '@mantine/core';
import { IconPencil, IconRefresh, IconClock, IconChevronDown } from '@tabler/icons-react';
import { ClientBenchmark, BenchmarkTemplate, RepMax } from '@ironlogic4/shared';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import {
  isBenchmarkEditable,
  formatDate,
  formatMeasurement,
  getBenchmarkAgeInDays,
  sortRepMaxesByReps,
  isRepMaxEditable,
  formatTimeSubMaxes,
  getLongestDistance,
  formatDistance,
  formatDistanceSubMaxes,
  getFastestTime,
  formatTimeSeconds,
} from '../../utils/benchmarkUtils';
import { useState } from 'react';
import { RepMaxCard } from './RepMaxCard';

interface BenchmarkCardProps {
  benchmark: ClientBenchmark;
  isHistorical: boolean;
  onEdit: (benchmark: ClientBenchmark) => void;
  onCreateNew: (benchmark: ClientBenchmark) => void;
  template?: BenchmarkTemplate;  // Template data to get rep max names
  onEditRepMax?: (repMax: RepMax, benchmarkId: string, allRepMaxes: RepMax[], templateRepMaxName: string, benchmarkName: string) => void;
  onCreateNewRepMax?: (repMax: RepMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateRepMaxName: string, templateRepMaxReps: number) => void;
}

export function BenchmarkCard({
  benchmark,
  isHistorical,
  onEdit,
  onCreateNew,
  template,
  onEditRepMax,
  onCreateNewRepMax,
}: BenchmarkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isEditable = !isHistorical && isBenchmarkEditable(benchmark);
  const ageInDays = getBenchmarkAgeInDays(benchmark);

  const measurementValue = formatMeasurement(
    benchmark.type,
    undefined, // weightKg is deprecated, use repMaxes instead
    benchmark.timeSeconds,
    benchmark.reps,
    benchmark.otherNotes,
    benchmark.repMaxes,
    benchmark.timeSubMaxes
  );

  // Helper functions for rep max template data
  const getTemplateRepMax = (templateRepMaxId: string) => {
    return template?.templateRepMaxes?.find((trm) => trm.id === templateRepMaxId);
  };

  const getTemplateName = (templateRepMaxId: string) => {
    return getTemplateRepMax(templateRepMaxId)?.name || 'Unknown';
  };

  const getTemplateReps = (templateRepMaxId: string) => {
    return getTemplateRepMax(templateRepMaxId)?.reps;
  };

  // Sort rep maxes for display
  const sortedRepMaxes = benchmark.repMaxes
    ? sortRepMaxesByReps(benchmark.repMaxes, getTemplateReps)
    : [];

  // Format time sub-maxes for DISTANCE benchmarks
  const formattedTimeSubMaxes = benchmark.type === BenchmarkType.DISTANCE && benchmark.timeSubMaxes && template
    ? formatTimeSubMaxes(benchmark.timeSubMaxes, template)
    : [];

  // Get longest distance for DISTANCE benchmarks
  const longestDistance = benchmark.type === BenchmarkType.DISTANCE && benchmark.timeSubMaxes && template
    ? formatDistance(getLongestDistance(benchmark.timeSubMaxes) || 0, template.distanceUnit!)
    : null;

  // Format distance sub-maxes for TIME benchmarks
  const formattedDistanceSubMaxes = benchmark.type === BenchmarkType.TIME && benchmark.distanceSubMaxes && template
    ? formatDistanceSubMaxes(benchmark.distanceSubMaxes, template)
    : [];

  // Get fastest time for TIME benchmarks
  const fastestTime = benchmark.type === BenchmarkType.TIME && benchmark.distanceSubMaxes && template
    ? formatTimeSeconds(getFastestTime(benchmark.distanceSubMaxes) || 0)
    : null;

  const handleEditRepMax = (repMax: RepMax) => {
    if (onEditRepMax && benchmark.repMaxes) {
      const templateRepMaxName = getTemplateName(repMax.templateRepMaxId);
      onEditRepMax(repMax, benchmark.id, benchmark.repMaxes, templateRepMaxName, benchmark.name);
    }
  };

  const handleCreateNewRepMax = (repMax: RepMax) => {
    if (onCreateNewRepMax && benchmark.repMaxes && template) {
      const templateRepMaxName = getTemplateName(repMax.templateRepMaxId);
      const templateRepMaxReps = getTemplateReps(repMax.templateRepMaxId);
      onCreateNewRepMax(repMax, benchmark, template, templateRepMaxName, templateRepMaxReps || 1);
    }
  };

  const getBadgeColor = () => {
    if (isHistorical) return 'gray';
    if (isEditable) return 'forestGreen';
    return 'orange';
  };

  const getActionButton = () => {
    // WEIGHT, DISTANCE, and TIME benchmarks check editability
    if (benchmark.type === BenchmarkType.WEIGHT || benchmark.type === BenchmarkType.DISTANCE || benchmark.type === BenchmarkType.TIME) {
      // Historical benchmarks are view-only
      if (isHistorical) {
        return null;
      }

      // If editable (< 14 days), show Edit button
      if (isEditable) {
        return (
          <Button
            variant="light"
            color="forestGreen"
            size="md"
            leftSection={<IconPencil size={18} />}
            onClick={() => onEdit(benchmark)}
            fullWidth
          >
            Edit
          </Button>
        );
      }

      // Show "Create New" button for old benchmarks (>= 14 days)
      return (
        <Button
          variant="light"
          color="orange"
          size="md"
          leftSection={<IconRefresh size={18} />}
          onClick={() => onCreateNew(benchmark)}
          fullWidth
        >
          Create New
        </Button>
      );
    }

    // Historical benchmarks are view-only
    if (isHistorical) {
      return null;
    }

    // Current benchmarks for other types: editable or create new
    if (isEditable) {
      return (
        <Button
          variant="light"
          color="forestGreen"
          size="md"
          leftSection={<IconPencil size={18} />}
          onClick={() => onEdit(benchmark)}
          fullWidth
        >
          Edit
        </Button>
      );
    }

    return (
      <Button
        variant="light"
        color="orange"
        size="md"
        leftSection={<IconRefresh size={18} />}
        onClick={() => onCreateNew(benchmark)}
        fullWidth
      >
        Create New
      </Button>
    );
  };

  return (
    <Card shadow="sm" padding={isExpanded ? "lg" : "sm"} radius="md" withBorder>
      <Stack gap="xs">
        {/* Always visible clickable header - only name and chevron */}
        <Group
          justify="space-between"
          align="center"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <Text fw={600} size="md" lineClamp={2} style={{ flex: 1 }}>
            {benchmark.name}
          </Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <IconChevronDown
              size={20}
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
              }}
            />
          </ActionIcon>
        </Group>

        {/* Collapsible section with all details */}
        <Collapse in={isExpanded}>
          <Stack gap="md">
            {/* Type badge */}
            <Badge color={getBadgeColor()} variant="light" size="lg" style={{ alignSelf: 'flex-start' }}>
              {benchmark.type}
            </Badge>

            {/* Rep Maxes Grid for WEIGHT benchmarks */}
            {benchmark.type === BenchmarkType.WEIGHT ? (
              !template ? (
                // Loading skeleton while template is being fetched
                <Stack gap="sm">
                  <Text size="sm" fw={500} c="dimmed">Rep Maxes</Text>
                  <SimpleGrid cols={2} spacing="sm">
                    <Skeleton height={100} radius="md" />
                    <Skeleton height={100} radius="md" />
                    <Skeleton height={100} radius="md" />
                    <Skeleton height={100} radius="md" />
                  </SimpleGrid>
                </Stack>
              ) : sortedRepMaxes.length > 0 ? (
                <Stack gap="sm">
                  <Text size="sm" fw={500} c="dimmed">Rep Maxes</Text>
                  <SimpleGrid cols={2} spacing="sm">
                    {sortedRepMaxes.map((repMax) => {
                      const templateRepMax = getTemplateRepMax(repMax.templateRepMaxId);
                      if (!templateRepMax) {
                        // Only warn if template exists but templateRepMax doesn't (genuine error)
                        console.warn(`Template rep max not found for ID: ${repMax.templateRepMaxId} in template ${template.id}`);
                        return null;
                      }
                      return (
                        <RepMaxCard
                          key={repMax.id}
                          repMax={repMax}
                          benchmarkId={benchmark.id}
                          benchmarkName={benchmark.name}
                          templateRepMaxName={templateRepMax.name}
                          templateRepMaxReps={templateRepMax.reps}
                          isHistorical={isHistorical}
                          isEditable={isRepMaxEditable(repMax)}
                          onEdit={() => handleEditRepMax(repMax)}
                          onCreateNew={() => handleCreateNewRepMax(repMax)}
                        />
                      );
                    })}
                  </SimpleGrid>
                </Stack>
              ) : (
                <Paper p="md" radius="md" bg="gray.0">
                  <Text size="sm" ta="center" c="dimmed">
                    No rep maxes recorded
                  </Text>
                </Paper>
              )
            ) : benchmark.type === BenchmarkType.DISTANCE ? (
              !template ? (
                // Loading skeleton while template is being fetched
                <Stack gap="sm">
                  <Text size="sm" fw={500} c="dimmed">Distances</Text>
                  <Skeleton height={80} radius="md" />
                </Stack>
              ) : formattedTimeSubMaxes.length > 0 ? (
                <Stack gap="sm">
                  <Text size="sm" fw={500} c="dimmed">Distances</Text>
                  {formattedTimeSubMaxes.map((tsm, index) => (
                    <Paper key={index} p="md" radius="md" bg="gray.0">
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">{tsm.name}</Text>
                        <Text size="lg" fw={700} c="forestGreen">
                          {tsm.distance} {tsm.unit}
                        </Text>
                      </Group>
                    </Paper>
                  ))}
                  {longestDistance && (
                    <Paper p="md" radius="md" bg="forestGreen.0">
                      <Group justify="space-between">
                        <Text size="sm" fw={500}>Best Distance</Text>
                        <Text size="xl" fw={700} c="forestGreen">
                          {longestDistance.value} {longestDistance.unit}
                        </Text>
                      </Group>
                    </Paper>
                  )}
                </Stack>
              ) : (
                <Paper p="md" radius="md" bg="gray.0">
                  <Text size="sm" ta="center" c="dimmed">
                    No distances recorded
                  </Text>
                </Paper>
              )
            ) : benchmark.type === BenchmarkType.TIME && formattedDistanceSubMaxes.length > 0 ? (
              <Stack gap="sm">
                <Text size="sm" fw={500} c="dimmed">Times</Text>
                {formattedDistanceSubMaxes.map((dsm, index) => (
                  <Paper key={index} p="md" radius="md" bg="gray.0">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{dsm.name}</Text>
                      <Text size="lg" fw={700} c="forestGreen">
                        {dsm.time}
                      </Text>
                    </Group>
                  </Paper>
                ))}
                {fastestTime && (
                  <Paper p="md" radius="md" bg="forestGreen.0">
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>Best Time</Text>
                      <Text size="xl" fw={700} c="forestGreen">
                        {fastestTime}
                      </Text>
                    </Group>
                  </Paper>
                )}
              </Stack>
            ) : (
              <>
                {/* Measurement value for non-WEIGHT benchmarks */}
                <Paper p="md" radius="md" bg="gray.0">
                  <Text size="xl" fw={700} ta="center" c="forestGreen">
                    {measurementValue}
                  </Text>
                </Paper>

                {/* Date and age information */}
                {benchmark.recordedAt && (
                  <Group gap="xs" align="center">
                    <IconClock size={16} style={{ opacity: 0.6 }} />
                    <Text size="sm" c="dimmed">
                      {formatDate(benchmark.recordedAt)}
                      {!isHistorical && ` (${ageInDays} day${ageInDays !== 1 ? 's' : ''} ago)`}
                    </Text>
                  </Group>
                )}
              </>
            )}

            {/* Notes section */}
            {benchmark.notes && (
              <Paper p="sm" radius="sm" bg="gray.0">
                <Text size="sm" c="dimmed">
                  {benchmark.notes}
                </Text>
              </Paper>
            )}

            {/* Action Button */}
            {getActionButton()}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}