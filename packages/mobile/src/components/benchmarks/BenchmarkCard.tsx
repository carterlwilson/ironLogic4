import { Card, Text, Group, Badge, Button, Stack, Paper, Collapse, ActionIcon, SimpleGrid, Skeleton, Menu } from '@mantine/core';
import { IconPencil, IconClock, IconChevronDown, IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { ClientBenchmark, BenchmarkTemplate, RepMax, TimeSubMax, DistanceSubMax } from '@ironlogic4/shared';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import {
  formatDate,
  formatMeasurement,
  getBenchmarkAgeInDays,
} from '../../utils/benchmarkUtils';
import { useState } from 'react';
import { RepMaxCard } from './RepMaxCard';
import { TimeSubMaxCard } from './TimeSubMaxCard';
import { DistanceSubMaxCard } from './DistanceSubMaxCard';

interface UnrecordedSubMaxCardProps {
  name: string;
  isHistorical: boolean;
  onUpdate?: () => void;
}

function UnrecordedSubMaxCard({ name, isHistorical, onUpdate }: UnrecordedSubMaxCardProps) {
  return (
    <Card
      shadow="xs"
      padding="sm"
      radius="md"
      withBorder
      style={{
        minHeight: '120px',
        cursor: !isHistorical && onUpdate ? 'pointer' : 'default',
        opacity: 0.7,
      }}
      onClick={!isHistorical && onUpdate ? () => onUpdate() : undefined}
    >
      <Stack gap="xs" h="100%" justify="space-between">
        <Group justify="space-between" align="flex-start">
          <Badge color="gray" variant="light" size="md">
            {name}
          </Badge>
          {!isHistorical && onUpdate && (
            <ActionIcon
              variant="subtle"
              color="forestGreen"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onUpdate(); }}
              aria-label={`Record ${name}`}
            >
              <IconPencil size={14} />
            </ActionIcon>
          )}
        </Group>
        <Text size="sm" c="dimmed" ta="center">Not recorded yet</Text>
      </Stack>
    </Card>
  );
}

interface BenchmarkCardProps {
  benchmark: ClientBenchmark;
  isHistorical: boolean;
  onEdit: (benchmark: ClientBenchmark) => void;
  template?: BenchmarkTemplate;
  onUpdateRepMax?: (repMax: RepMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateRepMaxName: string, templateRepMaxReps: number) => void;
  onUpdateTimeSubMax?: (timeSubMax: TimeSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateSubMaxName: string) => void;
  onUpdateDistanceSubMax?: (distanceSubMax: DistanceSubMax, benchmark: ClientBenchmark, template: BenchmarkTemplate, templateDistanceSubMaxName: string) => void;
  onDelete?: (benchmark: ClientBenchmark) => void;
}

export function BenchmarkCard({
  benchmark,
  isHistorical,
  onEdit,
  template,
  onUpdateRepMax,
  onUpdateTimeSubMax,
  onUpdateDistanceSubMax,
  onDelete,
}: BenchmarkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleUpdateRepMax = (repMax: RepMax) => {
    if (onUpdateRepMax && template) {
      const templateRepMaxName = getTemplateName(repMax.templateRepMaxId);
      const templateRepMaxReps = getTemplateReps(repMax.templateRepMaxId) || 1;
      onUpdateRepMax(repMax, benchmark, template, templateRepMaxName, templateRepMaxReps);
    }
  };

  const handleUpdateTimeSubMax = (timeSubMax: TimeSubMax) => {
    if (onUpdateTimeSubMax && template) {
      const templateSubMax = template.templateTimeSubMaxes?.find(t => t.id === timeSubMax.templateSubMaxId);
      const templateSubMaxName = templateSubMax?.name || 'Unknown';
      onUpdateTimeSubMax(timeSubMax, benchmark, template, templateSubMaxName);
    }
  };

  const handleUpdateDistanceSubMax = (distanceSubMax: DistanceSubMax) => {
    if (onUpdateDistanceSubMax && template) {
      const templateDistanceSubMax = template.templateDistanceSubMaxes?.find(t => t.id === distanceSubMax.templateDistanceSubMaxId);
      const templateDistanceSubMaxName = templateDistanceSubMax?.name || 'Unknown';
      onUpdateDistanceSubMax(distanceSubMax, benchmark, template, templateDistanceSubMaxName);
    }
  };

  const getBadgeColor = () => {
    if (isHistorical) return 'gray';
    return 'forestGreen';
  };

  const getActionButton = () => {
    if (isHistorical) return null;

    // WEIGHT and DISTANCE — sub-max cards handle individual updates
    if (benchmark.type === BenchmarkType.WEIGHT || benchmark.type === BenchmarkType.DISTANCE) {
      return null;
    }

    // TIME — complex (with distanceSubMaxes) or scalar
    if (benchmark.type === BenchmarkType.TIME) {
      // If template has distanceSubMaxes, those cards handle updates
      if (template?.templateDistanceSubMaxes && template.templateDistanceSubMaxes.length > 0) {
        return null;
      }
      // Scalar TIME or template not yet loaded — show Update button
      return (
        <Button
          variant="light"
          color="forestGreen"
          size="md"
          leftSection={<IconPencil size={18} />}
          onClick={() => onEdit(benchmark)}
          fullWidth
        >
          Update
        </Button>
      );
    }

    // REPS and OTHER
    return (
      <Button
        variant="light"
        color="forestGreen"
        size="md"
        leftSection={<IconPencil size={18} />}
        onClick={() => onEdit(benchmark)}
        fullWidth
      >
        Update
      </Button>
    );
  };

  return (
    <Card shadow="sm" padding={isExpanded ? "lg" : "sm"} radius="md" withBorder>
      <Stack gap="xs">
        {/* Always visible clickable header - name, menu, and chevron */}
        <Group
          justify="space-between"
          align="center"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <Text fw={600} size="md" lineClamp={2} style={{ flex: 1 }}>
            {benchmark.name}
          </Text>
          <Group gap={4} onClick={(e) => e.stopPropagation()}>
            <Menu withinPortal position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Benchmark options">
                  <IconDotsVertical size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {!isHistorical && (benchmark.type === BenchmarkType.REPS || benchmark.type === BenchmarkType.OTHER || (benchmark.type === BenchmarkType.TIME && !template?.templateDistanceSubMaxes?.length)) && (
                  <Menu.Item
                    leftSection={<IconPencil size={16} />}
                    onClick={() => onEdit(benchmark)}
                  >
                    Edit
                  </Menu.Item>
                )}
                {onDelete && (
                  <Menu.Item
                    leftSection={<IconTrash size={16} />}
                    color="red"
                    onClick={() => onDelete(benchmark)}
                  >
                    Delete
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
              onClick={() => setIsExpanded(!isExpanded)}
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
              ) : template.templateRepMaxes && template.templateRepMaxes.length > 0 ? (
                <Stack gap="sm">
                  <Text size="sm" fw={500} c="dimmed">Rep Maxes</Text>
                  <SimpleGrid cols={2} spacing="sm">
                    {[...template.templateRepMaxes]
                      .sort((a, b) => a.reps - b.reps)
                      .map((templateRepMax) => {
                        const existingRepMax = benchmark.repMaxes?.find(
                          rm => rm.templateRepMaxId === templateRepMax.id
                        );

                        if (existingRepMax) {
                          return (
                            <RepMaxCard
                              key={existingRepMax.id}
                              repMax={existingRepMax}
                              benchmarkId={benchmark.id}
                              benchmarkName={benchmark.name}
                              templateRepMaxName={templateRepMax.name}
                              templateRepMaxReps={templateRepMax.reps}
                              isHistorical={isHistorical}
                              onUpdate={!isHistorical ? () => handleUpdateRepMax(existingRepMax) : undefined}
                            />
                          );
                        } else {
                          return (
                            <UnrecordedSubMaxCard
                              key={templateRepMax.id}
                              name={templateRepMax.name}
                              isHistorical={isHistorical}
                              onUpdate={!isHistorical && onUpdateRepMax && template ? () => {
                                const syntheticRepMax: RepMax = {
                                  id: '',
                                  templateRepMaxId: templateRepMax.id,
                                  weightKg: 0,
                                  recordedAt: new Date(),
                                  createdAt: new Date(),
                                  updatedAt: new Date(),
                                };
                                onUpdateRepMax(syntheticRepMax, benchmark, template, templateRepMax.name, templateRepMax.reps);
                              } : undefined}
                            />
                          );
                        }
                      })}
                  </SimpleGrid>
                </Stack>
              ) : (
                <Paper p="md" radius="md" bg="gray.0">
                  <Text size="sm" ta="center" c="dimmed">
                    No rep max options in template
                  </Text>
                </Paper>
              )
            ) : benchmark.type === BenchmarkType.DISTANCE ? (
              !template ? (
                // Loading skeleton while template is being fetched
                <Stack gap="sm">
                  <Text size="sm" fw={500} c="dimmed">Distances</Text>
                  <SimpleGrid cols={2} spacing="sm">
                    <Skeleton height={120} radius="md" />
                    <Skeleton height={120} radius="md" />
                  </SimpleGrid>
                </Stack>
              ) : template.templateTimeSubMaxes && template.templateTimeSubMaxes.length > 0 ? (
                <Stack gap="sm">
                  <Text size="sm" fw={500} c="dimmed">Distances</Text>
                  <SimpleGrid cols={2} spacing="sm">
                    {template.templateTimeSubMaxes.map((templateSubMax) => {
                      const existingTimeSubMax = benchmark.timeSubMaxes?.find(
                        tsm => tsm.templateSubMaxId === templateSubMax.id
                      );

                      if (existingTimeSubMax) {
                        return (
                          <TimeSubMaxCard
                            key={existingTimeSubMax.id}
                            timeSubMax={existingTimeSubMax}
                            benchmarkId={benchmark.id}
                            benchmarkName={benchmark.name}
                            templateSubMaxName={templateSubMax.name}
                            distanceUnit={template.distanceUnit!}
                            isHistorical={isHistorical}
                            onUpdate={!isHistorical ? () => handleUpdateTimeSubMax(existingTimeSubMax) : undefined}
                          />
                        );
                      } else {
                        return (
                          <UnrecordedSubMaxCard
                            key={templateSubMax.id}
                            name={templateSubMax.name}
                            isHistorical={isHistorical}
                            onUpdate={!isHistorical && onUpdateTimeSubMax && template ? () => {
                              const syntheticTimeSubMax: TimeSubMax = {
                                id: '',
                                templateSubMaxId: templateSubMax.id,
                                distanceMeters: 0,
                                recordedAt: new Date(),
                                createdAt: new Date(),
                                updatedAt: new Date(),
                              };
                              onUpdateTimeSubMax(syntheticTimeSubMax, benchmark, template, templateSubMax.name);
                            } : undefined}
                          />
                        );
                      }
                    })}
                  </SimpleGrid>
                </Stack>
              ) : (
                <Paper p="md" radius="md" bg="gray.0">
                  <Text size="sm" ta="center" c="dimmed">
                    No distance options in template
                  </Text>
                </Paper>
              )
            ) : benchmark.type === BenchmarkType.TIME ? (
              !template ? (
                // Loading skeleton while template is being fetched
                <Stack gap="sm">
                  <Text size="sm" fw={500} c="dimmed">Times</Text>
                  <SimpleGrid cols={2} spacing="sm">
                    <Skeleton height={120} radius="md" />
                    <Skeleton height={120} radius="md" />
                  </SimpleGrid>
                </Stack>
              ) : template.templateDistanceSubMaxes && template.templateDistanceSubMaxes.length > 0 ? (
                <Stack gap="sm">
                  <Text size="sm" fw={500} c="dimmed">Times</Text>
                  <SimpleGrid cols={2} spacing="sm">
                    {template.templateDistanceSubMaxes.map((templateDistanceSubMax) => {
                      const existingDistanceSubMax = benchmark.distanceSubMaxes?.find(
                        dsm => dsm.templateDistanceSubMaxId === templateDistanceSubMax.id
                      );

                      if (existingDistanceSubMax) {
                        return (
                          <DistanceSubMaxCard
                            key={existingDistanceSubMax.id}
                            distanceSubMax={existingDistanceSubMax}
                            benchmarkId={benchmark.id}
                            benchmarkName={benchmark.name}
                            templateDistanceSubMaxName={templateDistanceSubMax.name}
                            isHistorical={isHistorical}
                            onUpdate={!isHistorical ? () => handleUpdateDistanceSubMax(existingDistanceSubMax) : undefined}
                          />
                        );
                      } else {
                        return (
                          <UnrecordedSubMaxCard
                            key={templateDistanceSubMax.id}
                            name={templateDistanceSubMax.name}
                            isHistorical={isHistorical}
                            onUpdate={!isHistorical && onUpdateDistanceSubMax && template ? () => {
                              const syntheticDistanceSubMax: DistanceSubMax = {
                                id: '',
                                templateDistanceSubMaxId: templateDistanceSubMax.id,
                                timeSeconds: 0,
                                recordedAt: new Date(),
                                createdAt: new Date(),
                                updatedAt: new Date(),
                              };
                              onUpdateDistanceSubMax(syntheticDistanceSubMax, benchmark, template, templateDistanceSubMax.name);
                            } : undefined}
                          />
                        );
                      }
                    })}
                  </SimpleGrid>
                </Stack>
              ) : (
                <Paper p="md" radius="md" bg="gray.0">
                  <Text size="sm" ta="center" c="dimmed">
                    No time options in template
                  </Text>
                </Paper>
              )
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
