import { Modal, Stack, Select, NumberInput, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { ActivityType } from '@ironlogic4/shared/types/activityTemplates';
import { DistanceUnit, ISet } from '@ironlogic4/shared/types/programs';
import type { IActivity } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import { SetsArrayInput } from './SetsArrayInput';

interface ActivityFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (activity: Omit<IActivity, 'id' | 'order'>) => void;
  existingActivity?: IActivity | null;
  templates: ActivityTemplate[];
  benchmarkTemplates: BenchmarkTemplate[];
  weightBenchmarkOptions: Array<{ value: string; label: string }>;
}

export function ActivityFormModal({ opened, onClose, onSubmit, existingActivity, templates, weightBenchmarkOptions }: ActivityFormModalProps) {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);

  const form = useForm<Omit<IActivity, 'id' | 'order'>>({
    initialValues: {
      activityTemplateId: existingActivity?.activityTemplateId || '',
      type: existingActivity?.type || ActivityType.LIFT,
      sets: existingActivity?.sets || [{ reps: 5, percentageOfMax: 0 }],
      time: existingActivity?.time || undefined,
      distance: existingActivity?.distance || undefined,
      distanceUnit: existingActivity?.distanceUnit || undefined,
    },
    validate: {
      activityTemplateId: (value) => (!value ? 'Activity template is required' : null),
      sets: (value, values) => {
        // For lift activities, sets array is required
        if (values.type === ActivityType.LIFT) {
          if (!value || !Array.isArray(value) || value.length === 0) {
            return 'At least one set is required for lift activities';
          }
          if (value.length > 20) {
            return 'Maximum 20 sets allowed';
          }
        }
        return null;
      },
    },
  });

  // Update form when existing activity changes
  useEffect(() => {
    if (existingActivity) {
      form.setValues({
        activityTemplateId: existingActivity.activityTemplateId,
        type: existingActivity.type,
        sets: existingActivity.sets || [{ reps: 5, percentageOfMax: 0 }],
        time: existingActivity.time,
        distance: existingActivity.distance,
        distanceUnit: existingActivity.distanceUnit,
      });
      setSelectedType(existingActivity.type);
    } else {
      form.reset();
      setSelectedType(null);
    }
  }, [existingActivity]);

  const handleSubmit = (values: Omit<IActivity, 'id' | 'order'>) => {
    // Clean up the values based on activity type
    const cleanedValues = { ...values };

    // Only lift activities should have sets array
    if (values.type !== ActivityType.LIFT) {
      cleanedValues.sets = undefined;
    }

    // Only cardio activities should have time/distance
    if (values.type !== ActivityType.CARDIO) {
      cleanedValues.time = undefined;
      cleanedValues.distance = undefined;
      cleanedValues.distanceUnit = undefined;
    }

    onSubmit(cleanedValues);
    form.reset();
    setSelectedType(null);
    onClose();
  };

  const handleClose = () => {
    form.reset();
    setSelectedType(null);
    onClose();
  };

  const handleTemplateChange = (templateId: string | null) => {
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        form.setFieldValue('activityTemplateId', templateId);
        form.setFieldValue('type', template.type);
        setSelectedType(template.type);
      }
    }
  };

  const showLiftFields = selectedType === ActivityType.LIFT;
  const showCardioFields = selectedType === ActivityType.CARDIO;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={existingActivity ? 'Edit Activity' : 'Add Activity'}
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="Activity Template"
            placeholder="Select template"
            data={templates.map(t => ({ value: t.id, label: t.name }))}
            searchable
            required
            {...form.getInputProps('activityTemplateId')}
            onChange={handleTemplateChange}
          />

          {showLiftFields && (
            <SetsArrayInput
              value={form.values.sets as ISet[] || []}
              onChange={(sets) => form.setFieldValue('sets', sets)}
              error={form.errors.sets as string}
              benchmarkOptions={weightBenchmarkOptions}
              benchmarksLoading={false}
            />
          )}

          {showCardioFields && (
            <>
              <NumberInput
                label="Time (minutes)"
                placeholder="Enter duration in minutes"
                min={1}
                {...form.getInputProps('time')}
              />
              <NumberInput
                label="Distance"
                placeholder="Enter distance"
                min={0}
                step={0.1}
                {...form.getInputProps('distance')}
              />
              <Select
                label="Distance Unit"
                placeholder="Select unit"
                data={[
                  { value: DistanceUnit.MILES, label: 'Miles' },
                  { value: DistanceUnit.KILOMETERS, label: 'Kilometers' },
                  { value: DistanceUnit.METERS, label: 'Meters' },
                  { value: DistanceUnit.YARDS, label: 'Yards' },
                ]}
                {...form.getInputProps('distanceUnit')}
              />
            </>
          )}


          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {existingActivity ? 'Save Changes' : 'Add Activity'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}