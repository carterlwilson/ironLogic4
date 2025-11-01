import { Table, Paper, Text, Badge, Group, ActionIcon, Stack, Skeleton } from '@mantine/core';
import { IconEdit, IconTrash, IconUsers } from '@tabler/icons-react';
import type { IScheduleTemplate } from '@ironlogic4/shared';
import { EmptyState } from '../shared/EmptyState';
import { getDayName } from '../../../utils/scheduleUtils';

interface TemplateTableProps {
  templates: IScheduleTemplate[];
  loading: boolean;
  onEdit: (template: IScheduleTemplate) => void;
  onDelete: (template: IScheduleTemplate) => void;
  onAddTemplate: () => void;
}

/**
 * Table displaying all schedule templates
 */
export function TemplateTable({
  templates,
  loading,
  onEdit,
  onDelete,
  onAddTemplate,
}: TemplateTableProps) {
  if (loading) {
    return (
      <Paper withBorder>
        <Stack gap="xs" p="md">
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </Stack>
      </Paper>
    );
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        title="No Schedule Templates"
        message="Create your first schedule template to get started."
        actionLabel="Create Template"
        onAction={onAddTemplate}
      />
    );
  }

  return (
    <Paper withBorder>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Days</Table.Th>
            <Table.Th>Coaches</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {templates.map((template) => (
            <Table.Tr key={template.id}>
              <Table.Td>
                <Text fw={600}>{template.name}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {template.description || 'No description'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {template.days.map((day) => (
                    <Badge key={day.dayOfWeek} size="sm" variant="light">
                      {getDayName(day.dayOfWeek)}
                    </Badge>
                  ))}
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <IconUsers size={16} />
                  <Text size="sm">{template.coachIds.length}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="light"
                    color="forestGreen"
                    onClick={() => onEdit(template)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => onDelete(template)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}