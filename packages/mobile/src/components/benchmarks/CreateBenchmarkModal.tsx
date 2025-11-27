import { Modal, Button, Select, Stack, Textarea, TextInput, NumberInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useMemo } from 'react';
import { BenchmarkTemplate, BenchmarkType, CreateMyBenchmarkInput } from '@ironlogic4/shared';
import { IconWeight, IconCalendar } from '@tabler/icons-react';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, parseDateStringToLocalDate } from '../../utils/benchmarkUtils';
import { getBenchmarkTemplate } from '../../services/benchmarkApi';

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
  const [fullTemplate, setFullTemplate] = useState<BenchmarkTemplate | null>(null);
  const [repMaxValues, setRepMaxValues] = useState<Record<string, number | string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

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

        // Skip validation for WEIGHT type as we'll validate repMaxes separately
        if (selectedTemplate.type === BenchmarkType.WEIGHT) {
          return null;
        }

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

  const handleTemplateChange = async (templateId: string | null) => {
    if (!templateId) {
      setSelectedTemplate(null);
      setFullTemplate(null);
      setRepMaxValues({});
      form.setFieldValue('templateId', '');
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      form.setFieldValue('templateId', templateId);
      form.setFieldValue('measurementValue', undefined);
      setRepMaxValues({});

      // Fetch full template with templateRepMaxes for WEIGHT type
      if (template.type === BenchmarkType.WEIGHT) {
        setLoadingTemplate(true);
        try {
          const response = await getBenchmarkTemplate(templateId);
          setFullTemplate(response.data);
        } catch (error) {
          console.error('Failed to load template details:', error);
        } finally {
          setLoadingTemplate(false);
        }
      } else {
        setFullTemplate(null);
      }
    }
  };

  const updateRepMaxValue = (templateRepMaxId: string, value: string | number) => {
    setRepMaxValues((prev) => ({
      ...prev,
      [templateRepMaxId]: value,
    }));
  };

  const handleSubmit = form.onSubmit(async (values) => {
    if (!selectedTemplate) return;

    const data: CreateMyBenchmarkInput = {
      templateId: values.templateId,
      notes: values.notes || undefined,
    };

    // Add measurement based on type
    if (selectedTemplate.type === BenchmarkType.WEIGHT) {
      // Create repMaxes for ALL templateRepMaxes (even if user didn't fill them in)
      const repMaxes = fullTemplate?.templateRepMaxes?.map(trm => {
        const value = repMaxValues[trm.id];
        return {
          templateRepMaxId: trm.id,
          weightKg: value && value !== ''
            ? (typeof value === 'string' ? parseFloat(value) : value)
            : 0,  // Default to 0 if empty
          recordedAt: parseDateStringToLocalDate(values.recordedAt),
        };
      }) || [];

      data.repMaxes = repMaxes;
    } else {
      // For non-WEIGHT types, use recordedAt from form
      data.recordedAt = parseDateStringToLocalDate(values.recordedAt);

      switch (selectedTemplate.type) {
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
    }

    await onCreate(data);
    form.reset();
    setSelectedTemplate(null);
    setFullTemplate(null);
    setRepMaxValues({});
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

          {selectedTemplate && selectedTemplate.type === BenchmarkType.WEIGHT && (
            <>
              {loadingTemplate ? (
                <Text size="sm" c="dimmed">Loading rep max options...</Text>
              ) : fullTemplate?.templateRepMaxes && fullTemplate.templateRepMaxes.length > 0 ? (
                <>
                  <Stack gap="md">
                    <Text size="sm" fw={500}>Enter your rep maxes (at least one required)</Text>
                    {fullTemplate.templateRepMaxes
                      .sort((a, b) => a.reps - b.reps)
                      .map((trm) => (
                        <NumberInput
                          key={trm.id}
                          label={`${trm.name} (${trm.reps} rep${trm.reps > 1 ? 's' : ''})`}
                          placeholder="Weight in kg"
                          value={repMaxValues[trm.id] || ''}
                          onChange={(val) => updateRepMaxValue(trm.id, val)}
                          min={0}
                          step={0.5}
                          decimalScale={1}
                          leftSection={<IconWeight size={16} />}
                          size="lg"
                        />
                      ))}
                    {form.errors.measurementValue && (
                      <Text size="sm" c="red">{form.errors.measurementValue}</Text>
                    )}
                  </Stack>

                  <TextInput
                    label="Date Recorded"
                    type="date"
                    {...form.getInputProps('recordedAt')}
                    required
                    max={formatDateForInput(new Date())}
                    size="lg"
                    leftSection={<IconCalendar size={16} />}
                    description="When did you achieve these rep maxes?"
                  />
                </>
              ) : (
                <Text size="sm" c="red">No rep max options available for this template</Text>
              )}

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

          {selectedTemplate && selectedTemplate.type !== BenchmarkType.WEIGHT && (
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