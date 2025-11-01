import { Modal, Stack, Select, NumberInput, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { ActivityType } from '@ironlogic4/shared/types/activityTemplates';
import { DistanceUnit } from '@ironlogic4/shared/types/programs';
import type { IActivity } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';

interface ActivityFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (activity: Omit<IActivity, 'id' | 'order'>) => void;
  existingActivity?: IActivity | null;
  templates: ActivityTemplate[];
}

export function ActivityFormModal({ opened, onClose, onSubmit, existingActivity, templates }: ActivityFormModalProps) {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);

  const form = useForm<Omit<IActivity, 'id' | 'order'>>({
    initialValues: {
      activityTemplateId: existingActivity?.activityTemplateId || '',
      type: existingActivity?.type || ActivityType.LIFT,
      sets: existingActivity?.sets || undefined,
      reps: existingActivity?.reps || undefined,
      percentageOfMax: existingActivity?.percentageOfMax || undefined,
      time: existingActivity?.time || undefined,
      distance: existingActivity?.distance || undefined,
      distanceUnit: existingActivity?.distanceUnit || undefined,
    },
    validate: {
      activityTemplateId: (value) => (!value ? 'Activity template is required' : null),
    },
  });

  // Update form when existing activity changes
  useEffect(() => {
    if (existingActivity) {
      form.setValues({
        activityTemplateId: existingActivity.activityTemplateId,
        type: existingActivity.type,
        sets: existingActivity.sets,
        reps: existingActivity.reps,
        percentageOfMax: existingActivity.percentageOfMax,
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
    onSubmit(values);
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
            <>
              <NumberInput
                label="Sets"
                placeholder="Enter number of sets"
                min={1}
                {...form.getInputProps('sets')}
              />
              <NumberInput
                label="Reps"
                placeholder="Enter number of reps"
                min={1}
                {...form.getInputProps('reps')}
              />
              <NumberInput
                label="Percentage of Max"
                placeholder="Enter percentage (e.g., 75)"
                min={0}
                max={200}
                suffix="%"
                {...form.getInputProps('percentageOfMax')}
              />
            </>
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

          {selectedType === ActivityType.OTHER && (
            <NumberInput
              label="Sets"
              placeholder="Enter number of sets"
              min={1}
              {...form.getInputProps('sets')}
            />
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