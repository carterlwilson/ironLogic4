import { Stack, Table, NumberInput, ActionIcon, Button, Group, Text, Select } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { ISet } from '@ironlogic4/shared/types/programs';

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

export function SetsArrayInput({ value, onChange, error, benchmarkOptions = [], benchmarksLoading = false }: SetsArrayInputProps) {
  const handleAddSet = () => {
    // Add a new set with default values
    const newSet: ISet = { reps: 5, percentageOfMax: 0 };
    onChange([...value, newSet]);
  };

  const handleRemoveSet = (index: number) => {
    const newSets = value.filter((_, i) => i !== index);
    onChange(newSets);
  };

  const handleUpdateSet = (index: number, field: keyof ISet, newValue: number | string | undefined) => {
    const newSets = [...value];
    if (field === 'benchmarkTemplateId') {
      newSets[index] = { ...newSets[index], [field]: newValue as string | undefined };
    } else {
      newSets[index] = { ...newSets[index], [field]: (newValue as number) || 0 };
    }
    onChange(newSets);
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
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Set</Table.Th>
              <Table.Th>Reps</Table.Th>
              <Table.Th>% of Max</Table.Th>
              {benchmarkOptions.length > 0 && <Table.Th>Benchmark</Table.Th>}
              <Table.Th style={{ width: '50px' }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {value.map((set, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {index + 1}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    min={1}
                    max={100}
                    value={set.reps}
                    onChange={(val) => handleUpdateSet(index, 'reps', val as number)}
                    hideControls
                    styles={{ input: { textAlign: 'center' } }}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    min={0}
                    max={200}
                    value={set.percentageOfMax}
                    onChange={(val) => handleUpdateSet(index, 'percentageOfMax', val as number)}
                    hideControls
                    styles={{ input: { textAlign: 'center' } }}
                  />
                </Table.Td>
                {benchmarkOptions.length > 0 && (
                  <Table.Td>
                    <Select
                      size="xs"
                      placeholder="Select benchmark"
                      data={benchmarkOptions}
                      value={set.benchmarkTemplateId || null}
                      onChange={(val) => handleUpdateSet(index, 'benchmarkTemplateId', val || undefined)}
                      disabled={benchmarksLoading}
                      clearable
                      searchable
                      styles={{ input: { minWidth: '150px' } }}
                    />
                  </Table.Td>
                )}
                <Table.Td>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    onClick={() => handleRemoveSet(index)}
                    disabled={value.length <= 1}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
