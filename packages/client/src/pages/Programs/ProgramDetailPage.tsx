import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Stack, Group, Button, Breadcrumbs, Anchor, Text, Loader, Center, Alert } from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconAlertCircle } from '@tabler/icons-react';
import { useProgram, useUpdateProgramStructure } from '../../hooks/usePrograms';
import { useActivityTemplateMap } from '../../hooks/useActivityTemplateMap';
import { useActivityGroups } from '../../hooks/useActivityGroups';
import { useAuth } from '../../providers/AuthProvider';
import { BlockList } from '../../components/Programs/Detail/BlockList';
import { ProgramProgressControl } from '../../components/Programs/Detail/ProgramProgressControl';
import type { IProgram } from '@ironlogic4/shared/types/programs';

export function ProgramDetailPage() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useProgram(programId);
  const updateProgramStructure = useUpdateProgramStructure();
  const { templateMap, templates } = useActivityTemplateMap(user?.gymId);
  const { groups: activityGroups } = useActivityGroups(user?.gymId);

  const [localProgram, setLocalProgram] = useState<IProgram | null>(null);
  const [isDirty, setIsDirty] = useState(false);

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

  const handleSave = async () => {
    if (!localProgram || !programId) return;

    try {
      await updateProgramStructure.mutateAsync({
        id: programId,
        program: { blocks: localProgram.blocks },
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
              onClick={handleSave}
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
          templateMap={templateMap}
          templates={templates}
          activityGroups={activityGroups}
        />
      </Stack>
    </Container>
  );
}