import { Modal, Stack, Select, NumberInput, Button, Group, Radio } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { ActivityType } from '@ironlogic4/shared/types/activityTemplates';
import { DistanceUnit, CardioType, ISet } from '@ironlogic4/shared/types/programs';
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
  distanceBenchmarkOptions: Array<{ value: string; label: string }>;
  timeBenchmarkOptions: Array<{ value: string; label: string }>;
}

export function ActivityFormModal({ opened, onClose, onSubmit, existingActivity, templates, weightBenchmarkOptions, distanceBenchmarkOptions, timeBenchmarkOptions }: ActivityFormModalProps) {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [cardioPrescriptionType, setCardioPrescriptionType] = useState<'static' | 'benchmark'>('static');
  const [staticCardioType, setStaticCardioType] = useState<CardioType | null>(null);

  const form = useForm<Omit<IActivity, 'id' | 'order'>>({
    initialValues: {
      activityTemplateId: existingActivity?.activityTemplateId || '',
      type: existingActivity?.type || ActivityType.LIFT,
      sets: existingActivity?.sets || [{ reps: 5, percentageOfMax: 0 }],
      cardioType: existingActivity?.cardioType || undefined,
      time: existingActivity?.time || undefined,
      distance: existingActivity?.distance || undefined,
      distanceUnit: existingActivity?.distanceUnit || undefined,
      repetitions: existingActivity?.repetitions || undefined,
      templateSubMaxId: existingActivity?.templateSubMaxId || undefined,
      percentageOfMax: existingActivity?.percentageOfMax || undefined,
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
        cardioType: existingActivity.cardioType,
        time: existingActivity.time,
        distance: existingActivity.distance,
        distanceUnit: existingActivity.distanceUnit,
        repetitions: existingActivity.repetitions,
        templateSubMaxId: existingActivity.templateSubMaxId,
        percentageOfMax: existingActivity.percentageOfMax,
      });
      setSelectedType(existingActivity.type);
      // Set cardio prescription type based on whether templateSubMaxId exists
      if (existingActivity.type === ActivityType.CARDIO) {
        if (existingActivity.templateSubMaxId) {
          setCardioPrescriptionType('benchmark');
        } else {
          setCardioPrescriptionType('static');
          setStaticCardioType(existingActivity.cardioType || null);
        }
      }
    } else {
      form.reset();
      setSelectedType(null);
      setCardioPrescriptionType('static');
      setStaticCardioType(null);
    }
  }, [existingActivity]);

  const handleSubmit = (values: Omit<IActivity, 'id' | 'order'>) => {
    // Clean up the values based on activity type
    const cleanedValues = { ...values };

    // Only lift activities should have sets array
    if (values.type !== ActivityType.LIFT) {
      cleanedValues.sets = undefined;
    }

    // Only cardio activities should have cardio fields
    if (values.type !== ActivityType.CARDIO) {
      cleanedValues.cardioType = undefined;
      cleanedValues.time = undefined;
      cleanedValues.distance = undefined;
      cleanedValues.distanceUnit = undefined;
      cleanedValues.repetitions = undefined;
      cleanedValues.templateSubMaxId = undefined;
      cleanedValues.percentageOfMax = undefined;
    } else {
      // For cardio, clean up based on mode
      if (cardioPrescriptionType === 'benchmark') {
        // Clear static fields
        cleanedValues.cardioType = undefined;
        cleanedValues.time = undefined;
        cleanedValues.distance = undefined;
        cleanedValues.distanceUnit = undefined;
        cleanedValues.repetitions = undefined;
      } else {
        // Clear benchmark fields
        cleanedValues.templateSubMaxId = undefined;
        cleanedValues.percentageOfMax = undefined;

        // Clear fields from other static types
        if (cleanedValues.cardioType === CardioType.TIME) {
          cleanedValues.distance = undefined;
          cleanedValues.distanceUnit = undefined;
          cleanedValues.repetitions = undefined;
        } else if (cleanedValues.cardioType === CardioType.DISTANCE) {
          cleanedValues.time = undefined;
          cleanedValues.repetitions = undefined;
        } else if (cleanedValues.cardioType === CardioType.REPETITIONS) {
          cleanedValues.time = undefined;
          cleanedValues.distance = undefined;
          cleanedValues.distanceUnit = undefined;
        }
      }
    }

    onSubmit(cleanedValues);
    form.reset();
    setSelectedType(null);
    setCardioPrescriptionType('static');
    setStaticCardioType(null);
    onClose();
  };

  const handleClose = () => {
    form.reset();
    setSelectedType(null);
    setCardioPrescriptionType('static');
    setStaticCardioType(null);
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
              <Radio.Group
                label="Cardio Prescription Type"
                value={cardioPrescriptionType}
                onChange={(value) => {
                  setCardioPrescriptionType(value as 'static' | 'benchmark');
                  if (value === 'static') {
                    // Clear benchmark fields
                    form.setFieldValue('templateSubMaxId', undefined);
                    form.setFieldValue('percentageOfMax', undefined);
                  } else {
                    // Clear static fields
                    form.setFieldValue('cardioType', undefined);
                    form.setFieldValue('time', undefined);
                    form.setFieldValue('distance', undefined);
                    form.setFieldValue('distanceUnit', undefined);
                    form.setFieldValue('repetitions', undefined);
                  }
                }}
              >
                <Group mt="xs">
                  <Radio value="static" label="Static (fixed prescription)" />
                  <Radio value="benchmark" label="Benchmark-based (% of client PR)" />
                </Group>
              </Radio.Group>

              {cardioPrescriptionType === 'static' ? (
                <>
                  <Radio.Group
                    label="Cardio Type"
                    value={staticCardioType}
                    onChange={(value) => {
                      setStaticCardioType(value as CardioType);
                      form.setFieldValue('cardioType', value as CardioType);

                      // Clear fields from other types
                      if (value === CardioType.TIME) {
                        form.setFieldValue('distance', undefined);
                        form.setFieldValue('distanceUnit', undefined);
                        form.setFieldValue('repetitions', undefined);
                      } else if (value === CardioType.DISTANCE) {
                        form.setFieldValue('time', undefined);
                        form.setFieldValue('repetitions', undefined);
                      } else if (value === CardioType.REPETITIONS) {
                        form.setFieldValue('time', undefined);
                        form.setFieldValue('distance', undefined);
                        form.setFieldValue('distanceUnit', undefined);
                      }
                    }}
                    required
                  >
                    <Group mt="xs">
                      <Radio value={CardioType.TIME} label="Time-based" />
                      <Radio value={CardioType.DISTANCE} label="Distance-based" />
                      <Radio value={CardioType.REPETITIONS} label="Repetitions" />
                    </Group>
                  </Radio.Group>

                  {staticCardioType === CardioType.TIME && (
                    <NumberInput
                      label="Time (minutes)"
                      placeholder="Enter duration in minutes"
                      min={1}
                      {...form.getInputProps('time')}
                      required
                    />
                  )}

                  {staticCardioType === CardioType.DISTANCE && (
                    <>
                      <NumberInput
                        label="Distance"
                        placeholder="Enter distance"
                        min={0}
                        step={0.1}
                        {...form.getInputProps('distance')}
                        required
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
                        required
                      />
                    </>
                  )}

                  {staticCardioType === CardioType.REPETITIONS && (
                    <NumberInput
                      label="Repetitions"
                      placeholder="Enter number of reps (e.g., 20 burpees)"
                      min={1}
                      max={10000}
                      {...form.getInputProps('repetitions')}
                      required
                    />
                  )}
                </>
              ) : (
                <>
                  <Select
                    label="Distance/Time Benchmark"
                    placeholder="Select a benchmark"
                    data={[
                      {
                        group: 'Distance Benchmarks',
                        items: distanceBenchmarkOptions
                      },
                      {
                        group: 'Time Benchmarks',
                        items: timeBenchmarkOptions
                      }
                    ]}
                    {...form.getInputProps('templateSubMaxId')}
                    searchable
                    required
                  />
                  <NumberInput
                    label="Percentage of Max"
                    placeholder="e.g., 80"
                    {...form.getInputProps('percentageOfMax')}
                    min={0}
                    max={200}
                    suffix="%"
                    required
                  />
                </>
              )}
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