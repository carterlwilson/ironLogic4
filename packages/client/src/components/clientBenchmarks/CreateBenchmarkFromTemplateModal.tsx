import { Modal, Stack, Group, Button, Select, NumberInput, TextInput, Textarea, Text, Paper, Badge, Checkbox } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { parseTimeString, validateTimeString } from '../../utils/benchmarkFormatters';
import { getBenchmarkTemplate } from '../../services/benchmarkApi';

interface CreateBenchmarkFromTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  templates: BenchmarkTemplate[];
  onSubmit: (benchmark: Omit<ClientBenchmark, 'id' | 'createdAt' | 'updatedAt'>, isHistorical: boolean) => Promise<void>;
  loading?: boolean;
}

interface FormValues {
  templateId: string;
  weightKg?: number; // Deprecated, kept for backward compatibility
  timeString?: string;
  reps?: number;
  otherNotes?: string;
  personalNotes?: string;
  recordedAt: Date;
}

export function CreateBenchmarkFromTemplateModal({
  opened,
  onClose,
  templates,
  onSubmit,
  loading = false,
}: CreateBenchmarkFromTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<BenchmarkTemplate | null>(null);
  const [fullTemplate, setFullTemplate] = useState<BenchmarkTemplate | null>(null);
  const [isHistorical, setIsHistorical] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      templateId: '',
      recordedAt: new Date(),
      personalNotes: '',
    },
    validate: {
      templateId: (value) => (!value ? 'Please select a template' : null),
      timeString: (value) => {
        if (selectedTemplate?.type === BenchmarkType.TIME && !value) {
          return 'Time is required';
        }
        if (selectedTemplate?.type === BenchmarkType.TIME && value && !validateTimeString(value)) {
          return 'Invalid time format (use MM:SS)';
        }
        return null;
      },
      reps: (value) => {
        if (selectedTemplate?.type === BenchmarkType.REPS && !value) {
          return 'Reps are required';
        }
        if (selectedTemplate?.type === BenchmarkType.REPS && value !== undefined && value <= 0) {
          return 'Reps must be greater than 0';
        }
        return null;
      },
      otherNotes: (value) => {
        if (selectedTemplate?.type === BenchmarkType.OTHER && !value) {
          return 'Notes are required';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    const loadTemplate = async () => {
      if (form.values.templateId) {
        const template = templates.find((t) => t.id === form.values.templateId);
        setSelectedTemplate(template || null);

        // Fetch full template with templateRepMaxes for WEIGHT type
        if (template?.type === BenchmarkType.WEIGHT) {
          try {
            const response = await getBenchmarkTemplate(template.id);
            setFullTemplate(response.data);
          } catch (error) {
            console.error('Failed to load template details:', error);
            setFullTemplate(null);
          }
        } else {
          setFullTemplate(null);
        }
      } else {
        setSelectedTemplate(null);
        setFullTemplate(null);
      }
    };

    loadTemplate();
  }, [form.values.templateId, templates]);

  const handleSubmit = async (values: FormValues) => {
    if (!selectedTemplate) return;

    const benchmarkData: Omit<ClientBenchmark, 'id' | 'createdAt' | 'updatedAt'> = {
      templateId: selectedTemplate.id,
      name: selectedTemplate.name,
      type: selectedTemplate.type,
      tags: selectedTemplate.tags,
      notes: selectedTemplate.notes,
      recordedAt: values.recordedAt,
    };

    // Add measurement based on type
    if (selectedTemplate.type === BenchmarkType.WEIGHT) {
      // Auto-create empty repMaxes for standard rep ranges (1, 2, 3, 5, 8)
      if (fullTemplate?.templateRepMaxes) {
        benchmarkData.repMaxes = fullTemplate.templateRepMaxes.map(trm => ({
          templateRepMaxId: trm.id,
          weightKg: 0,  // Empty weight - coach/owner will fill in via Edit modal
          recordedAt: values.recordedAt,
        })) as any; // Backend will add id, createdAt, updatedAt
      } else {
        benchmarkData.repMaxes = []; // Fallback if template not loaded
      }
    } else if (selectedTemplate.type === BenchmarkType.TIME && values.timeString) {
      benchmarkData.timeSeconds = parseTimeString(values.timeString);
    } else if (selectedTemplate.type === BenchmarkType.REPS && values.reps) {
      benchmarkData.reps = values.reps;
    } else if (selectedTemplate.type === BenchmarkType.OTHER && values.otherNotes) {
      benchmarkData.otherNotes = values.otherNotes;
    }

    // Add personal notes if provided
    if (values.personalNotes) {
      benchmarkData.notes = values.personalNotes;
    }

    try {
      await onSubmit(benchmarkData, isHistorical);
      form.reset();
      setSelectedTemplate(null);
      setIsHistorical(false);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedTemplate(null);
    setIsHistorical(false);
    onClose();
  };

  const templateOptions = templates.map((template) => ({
    value: template.id,
    label: `${template.name} (${template.type})`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add Benchmark from Template"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="Select Template"
            placeholder="Choose a benchmark template"
            data={templateOptions}
            searchable
            required
            {...form.getInputProps('templateId')}
          />

          {selectedTemplate && (
            <Paper p="md" withBorder>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    {selectedTemplate.name}
                  </Text>
                  <Badge variant="light">
                    {selectedTemplate.type}
                  </Badge>
                </Group>
                {selectedTemplate.notes && (
                  <Text size="xs" c="dimmed">
                    {selectedTemplate.notes}
                  </Text>
                )}
                {selectedTemplate.tags.length > 0 && (
                  <Group gap="xs">
                    {selectedTemplate.tags.map((tag) => (
                      <Badge key={tag} size="sm" variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Stack>
            </Paper>
          )}

          {selectedTemplate?.type === BenchmarkType.TIME && (
            <TextInput
              label="Time"
              placeholder="MM:SS (e.g., 05:30)"
              required
              {...form.getInputProps('timeString')}
            />
          )}

          {selectedTemplate?.type === BenchmarkType.REPS && (
            <NumberInput
              label="Reps"
              placeholder="Enter number of reps"
              min={0}
              required
              {...form.getInputProps('reps')}
            />
          )}

          {selectedTemplate?.type === BenchmarkType.OTHER && (
            <Textarea
              label="Notes"
              placeholder="Enter measurement notes"
              required
              {...form.getInputProps('otherNotes')}
            />
          )}

          <DatePickerInput
            label="Recorded Date"
            placeholder="Select date"
            required
            {...form.getInputProps('recordedAt')}
          />

          <Checkbox
            label="Mark as historical benchmark"
            description="Historical benchmarks represent past performance records"
            checked={isHistorical}
            onChange={(event) => setIsHistorical(event.currentTarget.checked)}
          />

          <Textarea
            label="Personal Notes (Optional)"
            placeholder="Add any additional notes"
            {...form.getInputProps('personalNotes')}
          />

          <Group justify="flex-end" gap="md" mt="md">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="green"
              loading={loading}
              disabled={!selectedTemplate}
            >
              Add Benchmark
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}