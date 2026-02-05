import { Modal, Button, Select, Stack, Textarea, TextInput, NumberInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useMemo, useEffect } from 'react';
import { BenchmarkTemplate, BenchmarkType, CreateMyBenchmarkInput, DistanceUnit } from '@ironlogic4/shared';
import { IconWeight, IconCalendar, IconRun, IconClock } from '@tabler/icons-react';
import { BenchmarkMeasurementInput } from './BenchmarkMeasurementInput';
import { formatDateForInput, parseDateStringToLocalDate, convertDistanceToMeters } from '../../utils/benchmarkUtils';
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
  const [timeSubMaxValues, setTimeSubMaxValues] = useState<Record<string, number | string>>({});
  const [distanceSubMaxValues, setDistanceSubMaxValues] = useState<Record<string, number | string>>({});
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

        // Skip validation for WEIGHT and DISTANCE types as we'll validate separately
        if (selectedTemplate.type === BenchmarkType.WEIGHT || selectedTemplate.type === BenchmarkType.DISTANCE) {
          return null;
        }

        // Skip validation for TIME type if it has templateDistanceSubMaxes (new multi-distance TIME benchmarks)
        if (selectedTemplate.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0) {
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

  // Reset form and date when modal opens
  useEffect(() => {
    if (opened) {
      form.reset();
      form.setFieldValue('recordedAt', formatDateForInput(new Date()));
      setSelectedTemplate(null);
      setFullTemplate(null);
      setRepMaxValues({});
      setTimeSubMaxValues({});
      setDistanceSubMaxValues({});
    }
  }, [opened]);

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
      setTimeSubMaxValues({});
      setDistanceSubMaxValues({});
      form.setFieldValue('templateId', '');
      return;
    }

    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      form.setFieldValue('templateId', templateId);
      form.setFieldValue('measurementValue', undefined);
      setRepMaxValues({});
      setTimeSubMaxValues({});
      setDistanceSubMaxValues({});

      // Fetch full template with templateRepMaxes for WEIGHT type, templateTimeSubMaxes for DISTANCE type, or templateDistanceSubMaxes for TIME type
      if (template.type === BenchmarkType.WEIGHT || template.type === BenchmarkType.DISTANCE || template.type === BenchmarkType.TIME) {
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

  const updateTimeSubMaxValue = (templateSubMaxId: string, value: string | number) => {
    setTimeSubMaxValues((prev) => ({
      ...prev,
      [templateSubMaxId]: value,
    }));
  };

  const updateDistanceSubMaxValue = (templateDistanceSubMaxId: string, value: string | number) => {
    setDistanceSubMaxValues((prev) => ({
      ...prev,
      [templateDistanceSubMaxId]: value,
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
    } else if (selectedTemplate.type === BenchmarkType.DISTANCE) {
      // Create timeSubMaxes for ALL templateTimeSubMaxes
      const timeSubMaxes = fullTemplate?.templateTimeSubMaxes?.map(tsm => {
        const value = timeSubMaxValues[tsm.id];
        const distanceValue = value && value !== ''
          ? (typeof value === 'string' ? parseFloat(value) : value)
          : 0;

        // Convert to meters if template uses kilometers
        const distanceMeters = fullTemplate.distanceUnit === DistanceUnit.KILOMETERS
          ? convertDistanceToMeters(distanceValue, DistanceUnit.KILOMETERS)
          : distanceValue;

        return {
          templateSubMaxId: tsm.id,
          distanceMeters,
          recordedAt: parseDateStringToLocalDate(values.recordedAt),
        };
      }) || [];

      data.timeSubMaxes = timeSubMaxes;
    } else if (selectedTemplate.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0) {
      // Create distanceSubMaxes for ALL templateDistanceSubMaxes
      const distanceSubMaxes = fullTemplate.templateDistanceSubMaxes.map(dsm => {
        const value = distanceSubMaxValues[dsm.id];
        const timeValue = value && value !== ''
          ? (typeof value === 'string' ? parseFloat(value) : value)
          : 0;

        return {
          templateDistanceSubMaxId: dsm.id,
          timeSeconds: timeValue,  // Store as raw seconds
          recordedAt: parseDateStringToLocalDate(values.recordedAt),
        };
      });

      data.distanceSubMaxes = distanceSubMaxes;
    } else {
      // For non-WEIGHT, non-DISTANCE, non-multi-distance-TIME types, use recordedAt from form
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
    setTimeSubMaxValues({});
    setDistanceSubMaxValues({});
  });

  const handleClose = () => {
    form.reset();
    setSelectedTemplate(null);
    setFullTemplate(null);
    setRepMaxValues({});
    setTimeSubMaxValues({});
    setDistanceSubMaxValues({});
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

          {selectedTemplate && selectedTemplate.type === BenchmarkType.DISTANCE && (
            <>
              {loadingTemplate ? (
                <Text size="sm" c="dimmed">Loading distance intervals...</Text>
              ) : fullTemplate?.templateTimeSubMaxes && fullTemplate.templateTimeSubMaxes.length > 0 ? (
                <>
                  <Stack gap="md">
                    <Text size="sm" fw={500}>
                      Enter distances covered for each time interval in {fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 'kilometers' : 'meters'}
                    </Text>
                    {fullTemplate.templateTimeSubMaxes.map((tsm) => (
                      <NumberInput
                        key={tsm.id}
                        label={tsm.name}
                        placeholder={`Distance in ${fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 'km' : 'm'}`}
                        value={timeSubMaxValues[tsm.id] || ''}
                        onChange={(val) => updateTimeSubMaxValue(tsm.id, val)}
                        min={0}
                        step={fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 0.1 : 10}
                        decimalScale={fullTemplate.distanceUnit === DistanceUnit.KILOMETERS ? 2 : 0}
                        leftSection={<IconRun size={16} />}
                        size="lg"
                        description={`How far did you ${selectedTemplate.name.toLowerCase()} in ${tsm.name}?`}
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
                    description="When did you achieve these distances?"
                  />
                </>
              ) : (
                <Text size="sm" c="red">No time intervals available for this template</Text>
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

          {selectedTemplate && selectedTemplate.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0 && (
            <>
              {loadingTemplate ? (
                <Text size="sm" c="dimmed">Loading distance intervals...</Text>
              ) : (
                <>
                  <Stack gap="md">
                    <Text size="sm" fw={500}>
                      Enter time taken for each distance interval (in seconds)
                    </Text>
                    {fullTemplate.templateDistanceSubMaxes.map((dsm) => (
                      <NumberInput
                        key={dsm.id}
                        label={dsm.name}
                        placeholder="Time in seconds"
                        value={distanceSubMaxValues[dsm.id] || ''}
                        onChange={(val) => updateDistanceSubMaxValue(dsm.id, val)}
                        min={0}
                        step={1}
                        decimalScale={1}
                        leftSection={<IconClock size={16} />}
                        size="lg"
                        description={`How long did it take you to complete ${dsm.name}?`}
                      />
                    ))}
                  </Stack>

                  <TextInput
                    label="Date Recorded"
                    type="date"
                    {...form.getInputProps('recordedAt')}
                    required
                    max={formatDateForInput(new Date())}
                    size="lg"
                    leftSection={<IconCalendar size={16} />}
                    description="When did you achieve these times?"
                  />
                </>
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

          {selectedTemplate && selectedTemplate.type !== BenchmarkType.WEIGHT && selectedTemplate.type !== BenchmarkType.DISTANCE && !(selectedTemplate.type === BenchmarkType.TIME && fullTemplate?.templateDistanceSubMaxes && fullTemplate.templateDistanceSubMaxes.length > 0) && (
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