import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Stack, Group, Button, Breadcrumbs, Anchor, Text, Loader, Center, Alert } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconAlertCircle } from '@tabler/icons-react';
import { useProgram, useUpdateProgramStructure } from '../../hooks/usePrograms';
import { useActivityTemplateMap } from '../../hooks/useActivityTemplateMap';
import { useActivityGroups } from '../../hooks/useActivityGroups';
import { useBenchmarkTemplates } from '../../hooks/useBenchmarkTemplates';
import { useAuth } from '../../providers/AuthProvider';
import { BlockList } from '../../components/Programs/Detail/BlockList';
import { ProgramProgressControl } from '../../components/Programs/Detail/ProgramProgressControl';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { IProgram } from '@ironlogic4/shared/types/programs';
import type { ActivityGroupOption } from '../../hooks/useActivityGroupOptions';

export function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useProgram(programId);
  const updateProgramStructure = useUpdateProgramStructure();
  const { templateMap, templates } = useActivityTemplateMap(user?.gymId);
  const { groups: activityGroups } = useActivityGroups(user?.gymId);
  const { templates: benchmarkTemplates } = useBenchmarkTemplates(user?.gymId);

  const [localProgram, setLocalProgram] = useState<IProgram | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Track which blocks, weeks, and days are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Toggle function to add/remove IDs from the set
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Convert activityGroups to groupOptions format for dropdown
  const groupOptions: ActivityGroupOption[] = useMemo(() => {
    const options: ActivityGroupOption[] = [{ value: '', label: 'No group' }];
    if (activityGroups && activityGroups.length > 0) {
      options.push(...activityGroups.map(group => ({
        value: group.id,
        label: group.name,
      })));
    }
    return options;
  }, [activityGroups]);

  // Flatten rep maxes from all weight-based benchmarks for lift activities
  const weightBenchmarkOptions = useMemo(() => {
    return benchmarkTemplates
      .filter((template) => template.type === BenchmarkType.WEIGHT && template.templateRepMaxes)
      .flatMap((template) =>
        template.templateRepMaxes?.map((repMax) => ({
          value: repMax.id,
          label: `${template.name} - ${repMax.name}`,
        })) || []
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [benchmarkTemplates]);

  // Flatten time intervals from all distance-based benchmarks for cardio activities
  const distanceBenchmarkOptions = useMemo(() => {
    return benchmarkTemplates
      .filter((template) => template.type === BenchmarkType.DISTANCE && template.templateTimeSubMaxes)
      .flatMap((template) =>
        template.templateTimeSubMaxes?.map((timeSubMax) => ({
          value: timeSubMax.id,
          label: `${template.name} - ${timeSubMax.name}`,
        })) || []
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [benchmarkTemplates]);

  // Flatten distance intervals from all TIME-based benchmarks for cardio activities
  const timeBenchmarkOptions = useMemo(() => {
    return benchmarkTemplates
      .filter((template) => template.type === BenchmarkType.TIME && template.templateDistanceSubMaxes)
      .flatMap((template) =>
        template.templateDistanceSubMaxes?.map((distanceSubMax) => ({
          value: distanceSubMax.id,
          label: `${template.name} - ${distanceSubMax.name}`,
        })) || []
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [benchmarkTemplates]);

  // Initialize local program state when data loads
  useEffect(() => {
    if (data?.data) {
      setLocalProgram(data.data);
      setIsDirty(false);
    }
  }, [data]);

  // Keyboard shortcut for saving (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && localProgram) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, localProgram]);

  const handleSave = async (programToSave?: IProgram) => {
    const program = programToSave || localProgram;
    if (!program || !programId) return;

    try {
      await updateProgramStructure.mutateAsync({
        id: programId,
        program: { blocks: program.blocks },
      });
      setIsDirty(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleProgramChange = (updatedProgram: IProgram) => {
    setLocalProgram(updatedProgram);
    setIsDirty(true);
  };

  const handleProgramChangeWithAutoSave = (updatedProgram: IProgram) => {
    setLocalProgram(updatedProgram);
    setIsDirty(true);

    // Save immediately with the updated program
    handleSave(updatedProgram);
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="xl" />
        </Center>
      </Container>
    );
  }

  if (error || !localProgram) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error?.message || 'Failed to load program'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs>
          <Anchor onClick={() => navigate('/programs')}>Programs</Anchor>
          <Text>{localProgram.name}</Text>
        </Breadcrumbs>

        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="md" mb="xs">
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate('/programs')}
              >
                Back
              </Button>
            </Group>
            <Title order={1}>{localProgram.name}</Title>
            {localProgram.description && (
              <Text size="sm" c="dimmed" mt="xs">
                {localProgram.description}
              </Text>
            )}
          </div>

          <Group>
            {isDirty && (
              <Text size="sm" c="dimmed">
                Unsaved changes
              </Text>
            )}
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={() => handleSave()}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </Group>
        </Group>

        {/* Program Progress Control */}
        <ProgramProgressControl
          program={localProgram}
          onProgressUpdate={() => refetch()}
        />

        {/* Block List */}
        <BlockList
          program={localProgram}
          onProgramChange={handleProgramChange}
          onProgramChangeWithAutoSave={handleProgramChangeWithAutoSave}
          expandedIds={expandedIds}
          toggleExpanded={toggleExpanded}
          templateMap={templateMap}
          templates={templates}
          groupOptions={groupOptions}
          benchmarkTemplates={benchmarkTemplates}
          weightBenchmarkOptions={weightBenchmarkOptions}
          distanceBenchmarkOptions={distanceBenchmarkOptions}
          timeBenchmarkOptions={timeBenchmarkOptions}
        />
      </Stack>
    </Container>
  );
}