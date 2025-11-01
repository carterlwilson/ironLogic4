import { Modal, Stack, Text, Button, Group, Select, Paper, Badge } from '@mantine/core';
import { useState } from 'react';
import { IconTemplate, IconUsers } from '@tabler/icons-react';
import type { IScheduleTemplate } from '@ironlogic4/shared';
import { getDayName } from '../../../utils/scheduleUtils';

interface CreateFromTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  templates: IScheduleTemplate[];
  onConfirm: (templateId: string) => Promise<void>;
  loading?: boolean;
  coaches: Array<{ id: string; firstName?: string; lastName?: string; email: string }>;
}

/**
 * Modal for creating an active schedule from a template
 */
export function CreateFromTemplateModal({
  opened,
  onClose,
  templates,
  onConfirm,
  loading = false,
  coaches,
}: CreateFromTemplateModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const templateOptions = templates.map((template) => ({
    value: template.id,
    label: template.name,
  }));

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const getCoachName = (coachId: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return 'Unknown';
    return `${coach.firstName} ${coach.lastName}`.trim() || coach.email;
  };

  const handleConfirm = async () => {
    if (!selectedTemplateId) return;
    await onConfirm(selectedTemplateId);
    setSelectedTemplateId('');
    onClose();
  };

  const handleClose = () => {
    setSelectedTemplateId('');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconTemplate size={24} />
          <Text size="lg" fw={600}>
            Create Schedule from Template
          </Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <Select
          label="Select Template"
          placeholder="Choose a schedule template"
          data={templateOptions}
          value={selectedTemplateId}
          onChange={(value) => setSelectedTemplateId(value || '')}
          required
          searchable
        />

        {selectedTemplate && (
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Text fw={600}>{selectedTemplate.name}</Text>
              {selectedTemplate.description && (
                <Text size="sm" c="dimmed">
                  {selectedTemplate.description}
                </Text>
              )}

              <Group gap="xs">
                <IconUsers size={16} />
                <Text size="sm" fw={500}>
                  Coaches:
                </Text>
                {selectedTemplate.coachIds.map((coachId) => (
                  <Badge key={coachId} size="sm" variant="light">
                    {getCoachName(coachId)}
                  </Badge>
                ))}
              </Group>

              <Group gap="xs">
                <Text size="sm" fw={500}>
                  Days:
                </Text>
                {selectedTemplate.days.map((day) => (
                  <Badge key={day.dayOfWeek} size="sm" variant="light" color="forestGreen">
                    {getDayName(day.dayOfWeek)} ({day.timeSlots.length} slots)
                  </Badge>
                ))}
              </Group>
            </Stack>
          </Paper>
        )}

        <Text size="sm" c="dimmed">
          This will create a new active schedule based on the selected template.
          All timeslots will start with empty client assignments.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={loading}
            disabled={!selectedTemplateId}
          >
            Create Schedule
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}