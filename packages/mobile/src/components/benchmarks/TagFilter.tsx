import { Stack, Text, Group, Pill, ScrollArea } from '@mantine/core';

interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  currentCount: number;
  filteredCount: number;
}

export const TagFilter = ({
  tags,
  selectedTag,
  onTagSelect,
  currentCount,
  filteredCount,
}: TagFilterProps) => {
  // Don't render if there are no tags
  if (tags.length === 0) {
    return null;
  }

  const isAllSelected = selectedTag === null;

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>
          Filter by tag
        </Text>
        <Text size="sm" c="dimmed">
          Showing {filteredCount} of {currentCount}
        </Text>
      </Group>

      <ScrollArea.Autosize>
        <Pill.Group>
          <Pill
            size="lg"
            withRemoveButton={false}
            bg={isAllSelected ? 'forestGreen' : undefined}
            c={isAllSelected ? 'white' : undefined}
            fw={isAllSelected ? 700 : undefined}
            style={{ cursor: 'pointer' }}
            onClick={() => onTagSelect(null)}
          >
            All ({currentCount})
          </Pill>

          {tags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <Pill
                key={tag}
                size="lg"
                withRemoveButton={false}
                bg={isSelected ? 'forestGreen' : undefined}
                c={isSelected ? 'white' : undefined}
                fw={isSelected ? 700 : undefined}
                style={{ cursor: 'pointer' }}
                onClick={() => onTagSelect(tag)}
              >
                {tag}
              </Pill>
            );
          })}
        </Pill.Group>
      </ScrollArea.Autosize>
    </Stack>
  );
};
