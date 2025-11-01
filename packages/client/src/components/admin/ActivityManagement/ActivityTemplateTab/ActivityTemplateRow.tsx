import { Table, Group, ActionIcon, Tooltip, Text } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import { ActivityTypeBadge } from './ActivityTypeBadge';

interface ActivityTemplateRowProps {
  template: ActivityTemplate;
  groupName?: string;
  onEdit: (template: ActivityTemplate) => void;
  onDelete: (template: ActivityTemplate) => void;
}

export function ActivityTemplateRow({ template, groupName, onEdit, onDelete }: ActivityTemplateRowProps) {
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
        <ActivityTypeBadge type={template.type} />
      </Table.Td>
      <Table.Td>
        <Text size="sm">{groupName || '-'}</Text>
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