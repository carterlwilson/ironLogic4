import { Table, Group, ActionIcon, Tooltip, Text, Badge } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import type { BenchmarkTemplate } from '@ironlogic4/shared/types/benchmarkTemplates';
import { BenchmarkTypeBadge } from './BenchmarkTypeBadge';

interface BenchmarkTemplateRowProps {
  template: BenchmarkTemplate;
  onEdit: (template: BenchmarkTemplate) => void;
  onDelete: (template: BenchmarkTemplate) => void;
}

export function BenchmarkTemplateRow({ template, onEdit, onDelete }: BenchmarkTemplateRowProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>{template.name}</Text>
      </Table.Td>
      <Table.Td>
        <BenchmarkTypeBadge type={template.type} />
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          {template.tags.length > 0 ? (
            template.tags.map((tag, index) => (
              <Badge key={index} size="sm" variant="outline" color="gray">
                {tag}
              </Badge>
            ))
          ) : (
            <Text size="sm" c="dimmed">-</Text>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed" lineClamp={2}>
          {template.notes || '-'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{formatDate(template.createdAt)}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Edit template">
            <ActionIcon
              variant="subtle"
              color="forestGreen"
              onClick={() => onEdit(template)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Delete template">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => onDelete(template)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}