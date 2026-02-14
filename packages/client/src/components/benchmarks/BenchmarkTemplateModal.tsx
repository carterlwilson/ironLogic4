import { Modal, Stack, Group, TextInput, Textarea, Button, Select, TagsInput, Text, ActionIcon, Radio } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBarbell, IconPlus, IconTrash } from '@tabler/icons-react';
import { BenchmarkType, DistanceUnit } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { CreateBenchmarkTemplateRequest, UpdateBenchmarkTemplateRequest } from '../../services/benchmarkTemplateApi';

interface BenchmarkTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBenchmarkTemplateRequest | UpdateBenchmarkTemplateRequest) => Promise<void>;
  loading?: boolean;
  gymId: string;
  template?: BenchmarkTemplate | null;
}

const benchmarkTypeOptions = [
  { value: BenchmarkType.WEIGHT, label: 'Weight' },
  { value: BenchmarkType.DISTANCE, label: 'Distance' },
  { value: BenchmarkType.TIME, label: 'Time' },
  { value: BenchmarkType.REPS, label: 'Reps' },
  { value: BenchmarkType.OTHER, label: 'Other' },
];

export function BenchmarkTemplateModal({
  opened,
  onClose,
  onSubmit,
  loading = false,
  gymId,
  template,
}: BenchmarkTemplateModalProps) {
  const isEditMode = !!template;

  // Helper to get default distance intervals based on unit (for TIME benchmarks)
  const getDefaultDistanceIntervals = (unit: DistanceUnit): Array<{ name: string }> => {
    if (unit === DistanceUnit.KILOMETERS) {
      return [
        { name: '0.1km' },
        { name: '0.25km' },
        { name: '0.5km' },
      ];
    }
    // Default to meters
    return [
      { name: '100m' },
      { name: '250m' },
      { name: '500m' },
    ];
  };

  // State for distance-specific fields
  const [distanceUnit, setDistanceUnit] = React.useState<DistanceUnit>(
    template?.distanceUnit || DistanceUnit.METERS
  );
  const [timeSubMaxes, setTimeSubMaxes] = React.useState<Array<{ name: string }>>(
    template?.templateTimeSubMaxes || [
      { name: '1 min' },
      { name: '3 min' },
      { name: '5 min' },
    ]
  );
  const [distanceSubMaxes, setDistanceSubMaxes] = React.useState<Array<{ name: string }>>(
    template?.templateDistanceSubMaxes || [
      { name: '100m' },
      { name: '250m' },
      { name: '500m' },
    ]
  );

  const form = useForm<CreateBenchmarkTemplateRequest>({
    initialValues: {
      name: template?.name || '',
      notes: template?.notes || '',
      type: template?.type || BenchmarkType.WEIGHT,
      tags: template?.tags || [],
      gymId,
    },
    validate: {
      name: (value) => {
        if (!value?.trim()) return 'Name is required';
        if (value.trim().length < 1) return 'Name must be at least 1 character';
        if (value.trim().length > 100) return 'Name must be less than 100 characters';
        return null;
      },
      notes: (value) => {
        if (value && value.length > 500) return 'Notes must be less than 500 characters';
        return null;
      },
      type: (value) => {
        if (!value) return 'Type is required';
        return null;
      },
    },
  });

  // Helper functions for time sub-maxes
  const addTimeSubMax = () => {
    setTimeSubMaxes([...timeSubMaxes, { name: '' }]);
  };

  const removeTimeSubMax = (index: number) => {
    setTimeSubMaxes(timeSubMaxes.filter((_, i) => i !== index));
  };

  const updateTimeSubMax = (index: number, name: string) => {
    const updated = [...timeSubMaxes];
    updated[index] = { name };
    setTimeSubMaxes(updated);
  };

  // Helper functions for distance sub-maxes
  const addDistanceSubMax = () => {
    setDistanceSubMaxes([...distanceSubMaxes, { name: '' }]);
  };

  const removeDistanceSubMax = (index: number) => {
    setDistanceSubMaxes(distanceSubMaxes.filter((_, i) => i !== index));
  };

  const updateDistanceSubMax = (index: number, name: string) => {
    const updated = [...distanceSubMaxes];
    updated[index] = { name };
    setDistanceSubMaxes(updated);
  };

  const handleSubmit = async (values: CreateBenchmarkTemplateRequest) => {
    // Validate DISTANCE type requirements
    if (values.type === BenchmarkType.DISTANCE) {
      const validTimeSubMaxes = timeSubMaxes.filter(tsm => tsm.name.trim());
      if (validTimeSubMaxes.length === 0) {
        form.setFieldError('type', 'At least one time interval is required for Distance benchmarks');
        return;
      }
    }

    // Validate TIME type requirements
    if (values.type === BenchmarkType.TIME) {
      const validDistanceSubMaxes = distanceSubMaxes.filter(dsm => dsm.name.trim());
      if (validDistanceSubMaxes.length === 0) {
        form.setFieldError('type', 'At least one distance interval is required for Time benchmarks');
        return;
      }
    }

    if (isEditMode) {
      // For update, we don't send gymId
      const { gymId: _, templateRepMaxes: _r, templateTimeSubMaxes: _t, templateDistanceSubMaxes: _ds, distanceUnit: _d, ...cleanValues } = values as any;

      // Build payload based on type (same logic as create mode)
      let payload: any = { ...cleanValues };

      // For WEIGHT type benchmarks, include templateRepMaxes
      if (cleanValues.type === BenchmarkType.WEIGHT) {
        payload.templateRepMaxes = [
          { reps: 1, name: '1RM' },
          { reps: 2, name: '2RM' },
          { reps: 3, name: '3RM' },
          { reps: 5, name: '5RM' },
          { reps: 8, name: '8RM' },
        ];
      }

      // For DISTANCE type benchmarks, include templateTimeSubMaxes and distanceUnit
      if (cleanValues.type === BenchmarkType.DISTANCE) {
        const validTimeSubMaxes = timeSubMaxes.filter(tsm => tsm.name.trim());
        payload.templateTimeSubMaxes = validTimeSubMaxes;
        payload.distanceUnit = distanceUnit;
      }

      // For TIME type benchmarks, include templateDistanceSubMaxes and distanceUnit
      if (cleanValues.type === BenchmarkType.TIME) {
        const validDistanceSubMaxes = distanceSubMaxes.filter(dsm => dsm.name.trim());
        payload.templateDistanceSubMaxes = validDistanceSubMaxes;
        payload.distanceUnit = distanceUnit;
      }

      await onSubmit(payload);
    } else {
      // Remove any existing templateRepMaxes/templateTimeSubMaxes/templateDistanceSubMaxes from values to avoid contamination
      const { templateRepMaxes: _r, templateTimeSubMaxes: _t, templateDistanceSubMaxes: _ds, distanceUnit: _d, ...cleanValues } = values as any;

      // For WEIGHT type benchmarks, automatically create default templateRepMaxes
      const templateRepMaxes = cleanValues.type === BenchmarkType.WEIGHT
        ? [
            { reps: 1, name: '1RM' },
            { reps: 2, name: '2RM' },
            { reps: 3, name: '3RM' },
            { reps: 5, name: '5RM' },
            { reps: 8, name: '8RM' },
          ]
        : undefined;

      // For DISTANCE type benchmarks, include templateTimeSubMaxes and distanceUnit
      const templateTimeSubMaxes = cleanValues.type === BenchmarkType.DISTANCE
        ? timeSubMaxes.filter(tsm => tsm.name.trim())
        : undefined;

      const finalDistanceUnitForDistance = cleanValues.type === BenchmarkType.DISTANCE
        ? distanceUnit
        : undefined;

      // For TIME type benchmarks, include templateDistanceSubMaxes and distanceUnit
      const templateDistanceSubMaxes = cleanValues.type === BenchmarkType.TIME
        ? distanceSubMaxes.filter(dsm => dsm.name.trim())
        : undefined;

      const finalDistanceUnitForTime = cleanValues.type === BenchmarkType.TIME
        ? distanceUnit
        : undefined;

      // Build payload based on type
      let payload: any = { ...cleanValues, gymId };

      if (templateRepMaxes) {
        payload.templateRepMaxes = templateRepMaxes;
      }

      if (templateTimeSubMaxes) {
        payload.templateTimeSubMaxes = templateTimeSubMaxes;
        payload.distanceUnit = finalDistanceUnitForDistance;
      }

      if (templateDistanceSubMaxes) {
        payload.templateDistanceSubMaxes = templateDistanceSubMaxes;
        payload.distanceUnit = finalDistanceUnitForTime;
      }

      await onSubmit(payload);
    }

    // Only runs on success
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Update form when template changes (for edit mode)
  React.useEffect(() => {
    if (template) {
      form.setValues({
        name: template.name,
        notes: template.notes || '',
        type: template.type,
        tags: template.tags || [],
        gymId,
      });

      // Set distance-specific fields
      if (template.type === BenchmarkType.DISTANCE) {
        setDistanceUnit(template.distanceUnit || DistanceUnit.METERS);
        setTimeSubMaxes(template.templateTimeSubMaxes || [
          { name: '1 min' },
          { name: '3 min' },
          { name: '5 min' },
        ]);
      }

      // Set time-specific fields
      if (template.type === BenchmarkType.TIME) {
        setDistanceUnit(template.distanceUnit || DistanceUnit.METERS);
        setDistanceSubMaxes(template.templateDistanceSubMaxes || [
          { name: '100m' },
          { name: '250m' },
          { name: '500m' },
        ]);
      }
    } else {
      form.reset();
      setDistanceUnit(DistanceUnit.METERS);
      setTimeSubMaxes([
        { name: '1 min' },
        { name: '3 min' },
        { name: '5 min' },
      ]);
      setDistanceSubMaxes([
        { name: '100m' },
        { name: '250m' },
        { name: '500m' },
      ]);
    }
  }, [template]);

  // Reset distance intervals to defaults when unit changes (for TIME benchmarks only, in create mode)
  React.useEffect(() => {
    // Only apply for TIME type and when not in edit mode
    if (form.values.type === BenchmarkType.TIME && !template) {
      setDistanceSubMaxes(getDefaultDistanceIntervals(distanceUnit));
    }
  }, [distanceUnit, form.values.type, template]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEditMode ? 'Edit Benchmark Template' : 'Add New Benchmark Template'}
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="Enter template name (e.g., Back Squat, 400m Run)"
            leftSection={<IconBarbell size={16} />}
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Benchmark Type"
            placeholder="Select type"
            data={benchmarkTypeOptions}
            required
            {...form.getInputProps('type')}
          />

          {/* Distance-specific fields */}
          {form.values.type === BenchmarkType.DISTANCE && (
            <>
              <Radio.Group
                label="Distance Unit"
                description="Choose the unit for recording distances"
                value={distanceUnit}
                onChange={(value) => setDistanceUnit(value as DistanceUnit)}
                required
              >
                <Group mt="xs">
                  <Radio value={DistanceUnit.METERS} label="Meters" />
                  <Radio value={DistanceUnit.KILOMETERS} label="Kilometers" />
                </Group>
              </Radio.Group>

              <Stack gap="xs">
                <Group justify="space-between">
                  <div>
                    <Text fw={500} size="sm">Time Intervals</Text>
                    <Text size="xs" c="dimmed">Define time durations for recording distances</Text>
                  </div>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    onClick={addTimeSubMax}
                  >
                    Add Interval
                  </Button>
                </Group>

                {timeSubMaxes.map((tsm, index) => (
                  <Group key={index} gap="xs">
                    <TextInput
                      placeholder="e.g., 1 min, 500m, 30 sec"
                      value={tsm.name}
                      onChange={(e) => updateTimeSubMax(index, e.target.value)}
                      style={{ flex: 1 }}
                      required
                    />
                    {timeSubMaxes.length > 1 && (
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => removeTimeSubMax(index)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                ))}

                {timeSubMaxes.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No time intervals added yet. Click "Add Interval" to get started.
                  </Text>
                )}
              </Stack>
            </>
          )}

          {/* Time-specific fields */}
          {form.values.type === BenchmarkType.TIME && (
            <>
              <Radio.Group
                label="Distance Unit"
                description="Choose the unit for distance intervals"
                value={distanceUnit}
                onChange={(value) => setDistanceUnit(value as DistanceUnit)}
                required
              >
                <Group mt="xs">
                  <Radio value={DistanceUnit.METERS} label="Meters" />
                  <Radio value={DistanceUnit.KILOMETERS} label="Kilometers" />
                </Group>
              </Radio.Group>

              <Stack gap="xs">
                <Group justify="space-between">
                  <div>
                    <Text fw={500} size="sm">Distance Intervals</Text>
                    <Text size="xs" c="dimmed">Define distances for recording times</Text>
                  </div>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    onClick={addDistanceSubMax}
                  >
                    Add Interval
                  </Button>
                </Group>

                {distanceSubMaxes.map((dsm, index) => (
                  <Group key={index} gap="xs">
                    <TextInput
                      placeholder="e.g., 100m, 0.5km, 1 mile"
                      value={dsm.name}
                      onChange={(e) => updateDistanceSubMax(index, e.target.value)}
                      style={{ flex: 1 }}
                      required
                    />
                    {distanceSubMaxes.length > 1 && (
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => removeDistanceSubMax(index)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                ))}

                {distanceSubMaxes.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No distance intervals added yet. Click "Add Interval" to get started.
                  </Text>
                )}
              </Stack>
            </>
          )}

          <TagsInput
            label="Tags"
            placeholder="Enter tags and press Enter"
            description="Optional tags for categorizing benchmarks"
            {...form.getInputProps('tags')}
          />

          <Textarea
            label="Notes"
            placeholder="Add optional notes or description"
            minRows={3}
            maxRows={6}
            {...form.getInputProps('notes')}
          />

          {/* Actions */}
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
              disabled={!form.isValid()}
            >
              {isEditMode ? 'Update Template' : 'Create Template'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// Import React for useEffect
import React from 'react';