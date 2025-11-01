import { Modal, Button, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useMemo } from 'react';
import { BenchmarkTemplate, BenchmarkType, CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput } from '../../utils/benchmarkUtils';

interface CreateBenchmarkModalProps {
  opened: boolean;
  onClose: () => void;
  onCreate: (data: CreateMyBenchmarkInput) => Promise<void>;
  templates: BenchmarkTemplate[];
  loading: boolean;
}

export function CreateBenchmarkModal({
  opened,
  onClose,
  onCreate,
  templates,
  loading,
}: CreateBenchmarkModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<BenchmarkTemplate | null>(null);

  const form = useForm<{
    templateId: string;
    recordedAt: string;
    notes: string;
    measurementValue: number | string | undefined;
  }>({
    initialValues: {
      templateId: '',
      recordedAt: formatDateForInput(new Date()),
      notes: '',
      measurementValue: undefined,
    },
    validate: {
      templateId: (value) => (!value ? 'Please select a benchmark template' : null),
      recordedAt: (value) => (!value ? 'Please select a date' : null),
      measurementValue: (value) => {
        if (!selectedTemplate) return null;

        if (selectedTemplate.type === BenchmarkType.OTHER) {
          return !value ? 'Please enter measurement notes' : null;
        }

        if (selectedTemplate.type === BenchmarkType.TIME) {
          if (!value) return 'Please enter a time value';
          if (typeof value === 'string' && !value.match(/^\d{2}:\d{2}$/)) {
            return 'Invalid time format. Use MM:SS';
          }
          return null;
        }

        return value === undefined || value === '' ? 'Please enter a measurement value' : null;
      },
    },
  });

  const templateOptions = useMemo(
    () =>
      templates.map((template) => ({
        value: template.id,
        label: `${template.name} (${template.type})`,
      })),
    [templates]
  );

  const handleTemplateChange = (templateId: string | null) => {
    if (!templateId) {
      setSelectedTemplate(null);
      form.setFieldValue('templateId', '');
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      form.setFieldValue('templateId', templateId);
      form.setFieldValue('measurementValue', undefined);
    }
  };

  const handleSubmit = form.onSubmit(async (values) => {
    if (!selectedTemplate) return;

    const data: CreateMyBenchmarkInput = {
      templateId: values.templateId,
      recordedAt: new Date(values.recordedAt),
      notes: values.notes || undefined,
    };

    // Add measurement based on type
    switch (selectedTemplate.type) {
      case BenchmarkType.WEIGHT:
        data.weightKg = values.measurementValue as number;
        break;
      case BenchmarkType.TIME:
        data.timeSeconds = values.measurementValue as number;
        break;
      case BenchmarkType.REPS:
        data.reps = values.measurementValue as number;
        break;
      case BenchmarkType.OTHER:
        data.otherNotes = values.measurementValue as string;
        break;
    }

    await onCreate(data);
    form.reset();
    setSelectedTemplate(null);
  });

  const handleClose = () => {
    form.reset();
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create Benchmark"
      size="lg"
      fullScreen
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Benchmark Template"
            placeholder="Select a template"
            data={templateOptions}
            value={form.values.templateId}
            onChange={handleTemplateChange}
            error={form.errors.templateId}
            searchable
            required
            size="lg"
            description="Choose which benchmark you want to record"
          />

          {selectedTemplate && (
            <>
              <BenchmarkMeasurementInput
                type={selectedTemplate.type}
                value={form.values.measurementValue}
                onChange={(value) => form.setFieldValue('measurementValue', value)}
                error={typeof form.errors.measurementValue === 'string' ? form.errors.measurementValue : undefined}
                required
              />

              <TextInput
                label="Date Recorded"
                type="date"
                {...form.getInputProps('recordedAt')}
                required
                size="lg"
                description="When did you achieve this benchmark?"
              />

              <Textarea
                label="Notes (Optional)"
                placeholder="Add any additional notes..."
                {...form.getInputProps('notes')}
                minRows={3}
                maxRows={5}
                size="lg"
                description="Any context or details about this measurement"
              />
            </>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={!selectedTemplate}>
            Create Benchmark
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}