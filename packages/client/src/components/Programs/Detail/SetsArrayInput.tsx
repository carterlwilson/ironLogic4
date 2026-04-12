import { useState, useEffect } from 'react';
import { Stack, Table, NumberInput, ActionIcon, Button, Group, Text, Select, Checkbox, Tooltip } from '@mantine/core';
import { IconPlus, IconTrash, IconCopy, IconGripVertical, IconTrophy } from '@tabler/icons-react';
import { ISet } from '@ironlogic4/shared/types/programs';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BenchmarkOption {
  value: string;
  label: string;
}

interface SetsArrayInputProps {
  value: ISet[];
  onChange: (sets: ISet[]) => void;
  error?: string;
  benchmarkOptions?: BenchmarkOption[];
  benchmarksLoading?: boolean;
}

interface SortableSetRowProps {
  setId: string;
  set: ISet;
  index: number;
  totalSets: number;
  benchmarkOptions: BenchmarkOption[];
  benchmarksLoading: boolean;
  onUpdate: (index: number, field: keyof ISet, value: number | string | boolean | undefined) => void;
  onRemove: (index: number) => void;
  onCopy: (index: number) => void;
}

function SortableSetRow({
  setId,
  set,
  index,
  totalSets,
  benchmarkOptions,
  benchmarksLoading,
  onUpdate,
  onRemove,
  onCopy,
}: SortableSetRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: setId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isBenchmark = !!set.isBenchmarkSet;

  const handleBenchmarkToggle = (checked: boolean) => {
    onUpdate(index, 'isBenchmarkSet', checked);
    if (checked) {
      onUpdate(index, 'reps', 1);
      onUpdate(index, 'percentageOfMax', 100);
    }
  };

  return (
    <Table.Tr ref={setNodeRef} style={style}>
      <Table.Td style={{ width: '24px', cursor: 'grab', color: 'var(--mantine-color-dimmed)' }} {...listeners} {...attributes}>
        <IconGripVertical size={16} />
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <Text size="sm" fw={500}>{index + 1}</Text>
          {isBenchmark && <IconTrophy size={12} color="var(--mantine-color-yellow-6)" />}
        </Group>
      </Table.Td>
      <Table.Td style={{ minWidth: '60px' }}>
        <NumberInput
          size="xs"
          min={1}
          max={100}
          value={set.reps}
          onChange={(val) => onUpdate(index, 'reps', val as number)}
          hideControls
          allowLeadingZeros={false}
          disabled={isBenchmark}
          styles={{ input: { textAlign: 'center' } }}
        />
      </Table.Td>
      <Table.Td style={{ minWidth: '60px' }}>
        <NumberInput
          size="xs"
          min={0}
          max={200}
          value={set.percentageOfMax}
          onChange={(val) => onUpdate(index, 'percentageOfMax', val as number)}
          hideControls
          allowLeadingZeros={false}
          disabled={isBenchmark}
          styles={{ input: { textAlign: 'center' } }}
        />
      </Table.Td>
      {benchmarkOptions.length > 0 && (
        <Table.Td>
          <Select
            size="xs"
            placeholder="Select rep max"
            data={benchmarkOptions}
            value={set.templateRepMaxId || null}
            onChange={(val) => onUpdate(index, 'templateRepMaxId', val || undefined)}
            disabled={benchmarksLoading}
            clearable
            searchable
            styles={{ input: { minWidth: '150px' } }}
          />
        </Table.Td>
      )}
      <Table.Td>
        <Tooltip label="Benchmark set — athlete goes for a new max" position="top">
          <Checkbox
            size="xs"
            checked={isBenchmark}
            onChange={(e) => handleBenchmarkToggle(e.currentTarget.checked)}
            color="yellow"
            icon={() => <IconTrophy size={10} />}
          />
        </Tooltip>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => onCopy(index)}
            disabled={totalSets >= 20}
          >
            <IconCopy size={16} />
          </ActionIcon>
          <ActionIcon
            color="red"
            variant="subtle"
            size="sm"
            onClick={() => onRemove(index)}
            disabled={totalSets <= 1}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

export function SetsArrayInput({ value, onChange, error, benchmarkOptions = [], benchmarksLoading = false }: SetsArrayInputProps) {
  const [setIds, setSetIds] = useState<string[]>(() => value.map(() => crypto.randomUUID()));

  useEffect(() => {
    if (value.length > setIds.length) {
      setSetIds((prev) => [...prev, ...value.slice(prev.length).map(() => crypto.randomUUID())]);
    } else if (value.length < setIds.length) {
      setSetIds((prev) => prev.slice(0, value.length));
    }
  }, [value.length]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddSet = () => {
    const newSet: ISet = { reps: 5, percentageOfMax: 0 };
    onChange([...value, newSet]);
  };

  const handleRemoveSet = (index: number) => {
    const newSets = value.filter((_, i) => i !== index);
    setSetIds((prev) => prev.filter((_, i) => i !== index));
    onChange(newSets);
  };

  const handleUpdateSet = (index: number, field: keyof ISet, newValue: number | string | boolean | undefined) => {
    const newSets = [...value];
    if (field === 'templateRepMaxId') {
      newSets[index] = { ...newSets[index], [field]: newValue as string | undefined };
    } else if (field === 'isBenchmarkSet') {
      newSets[index] = { ...newSets[index], [field]: newValue as boolean };
    } else {
      const valueToStore = newValue === undefined || newValue === null ? '' : newValue;
      newSets[index] = { ...newSets[index], [field]: valueToStore } as any;
    }
    onChange(newSets);
  };

  const handleCopySet = (index: number) => {
    const copied = { ...value[index] };
    onChange([...value, copied]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = setIds.indexOf(active.id as string);
      const newIndex = setIds.indexOf(over.id as string);
      setSetIds(arrayMove(setIds, oldIndex, newIndex));
      onChange(arrayMove(value, oldIndex, newIndex));
    }
  };

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={500}>
          Sets {error && <Text component="span" size="xs" c="red">({error})</Text>}
        </Text>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={handleAddSet}
          disabled={value.length >= 20}
        >
          Add Set
        </Button>
      </Group>

      {value.length === 0 ? (
        <Text size="xs" c="dimmed">
          Click "Add Set" to add your first set
        </Text>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={setIds} strategy={verticalListSortingStrategy}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '24px' }}></Table.Th>
                  <Table.Th>Set</Table.Th>
                  <Table.Th style={{ minWidth: '60px' }}>Reps</Table.Th>
                  <Table.Th style={{ minWidth: '60px' }}>% of Max</Table.Th>
                  {benchmarkOptions.length > 0 && <Table.Th>Rep Max</Table.Th>}
                  <Table.Th style={{ width: '32px' }} title="Benchmark set"></Table.Th>
                  <Table.Th style={{ width: '70px' }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {value.map((set, index) => (
                  <SortableSetRow
                    key={setIds[index]}
                    setId={setIds[index]}
                    set={set}
                    index={index}
                    totalSets={value.length}
                    benchmarkOptions={benchmarkOptions}
                    benchmarksLoading={benchmarksLoading}
                    onUpdate={handleUpdateSet}
                    onRemove={handleRemoveSet}
                    onCopy={handleCopySet}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </SortableContext>
        </DndContext>
      )}
    </Stack>
  );
}
