import { Accordion, Table, Paper, Text, Badge, Group, ActionIcon, Stack, Skeleton, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash, IconToggleLeft, IconToggleRight } from '@tabler/icons-react';
import type { IScheduleTemplate } from '@ironlogic4/shared';
import type { Coach } from '../../../hooks/useCoaches';
import { EmptyState } from '../shared/EmptyState';
import { getDayName, formatTimeRange } from '../../../utils/scheduleUtils';

const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6] as const;

interface TemplateTableProps {
  templates: IScheduleTemplate[];
  loading: boolean;
  coaches: Coach[];
  onEdit: (template: IScheduleTemplate) => void;
  onDelete: (template: IScheduleTemplate) => void;
  onToggleActive: (template: IScheduleTemplate) => void;
  onAddTemplate: () => void;
}

export function TemplateTable({
  templates,
  loading,
  coaches,
  onEdit,
  onDelete,
  onToggleActive,
  onAddTemplate,
}: TemplateTableProps) {
  const coachMap = new Map(coaches.map(c => [c.id, c]));

  if (loading) {
    return (
      <Stack gap="xs">
        <Skeleton height={52} radius="md" />
        <Skeleton height={52} radius="md" />
        <Skeleton height={52} radius="md" />
      </Stack>
    );
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        title="No Schedule Templates"
        message="Create your first schedule template to get started."
        actionLabel="Add Template"
        onAction={onAddTemplate}
      />
    );
  }

  const byDay = new Map<number, IScheduleTemplate[]>();
  for (const t of templates) {
    const list = byDay.get(t.dayOfWeek) ?? [];
    list.push(t);
    byDay.set(t.dayOfWeek, list);
  }

  const activeDays = DAY_ORDER.filter(d => byDay.has(d));

  return (
    <Accordion variant="separated" multiple defaultValue={activeDays.map(String)}>
      {activeDays.map(day => {
        const dayTemplates = byDay.get(day)!;
        return (
          <Accordion.Item key={day} value={String(day)}>
            <Accordion.Control>
              <Group gap="sm">
                <Text fw={600}>{getDayName(day)}</Text>
                <Badge variant="light" color="gray" size="sm">
                  {dayTemplates.length} {dayTemplates.length === 1 ? 'template' : 'templates'}
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Paper>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Period</Table.Th>
                      <Table.Th>Time</Table.Th>
                      <Table.Th>Coach</Table.Th>
                      <Table.Th>Capacity</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {dayTemplates.map(template => {
                      const coach = coachMap.get(template.coachId);
                      const coachName = coach
                        ? `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim() || coach.email
                        : template.coachId;
                      return (
                        <Table.Tr key={template.id}>
                          <Table.Td>
                            <Badge variant="light" color={template.period === 'AM' ? 'blue' : 'violet'}>
                              {template.period}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatTimeRange(template.time, template.endTime)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{coachName}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{template.maxCapacity}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light" color={template.isActive ? 'green' : 'gray'}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Tooltip label={template.isActive ? 'Deactivate' : 'Activate'}>
                                <ActionIcon
                                  variant="light"
                                  color={template.isActive ? 'orange' : 'green'}
                                  onClick={() => onToggleActive(template)}
                                >
                                  {template.isActive
                                    ? <IconToggleRight size={16} />
                                    : <IconToggleLeft size={16} />}
                                </ActionIcon>
                              </Tooltip>
                              <ActionIcon variant="light" color="blue" onClick={() => onEdit(template)}>
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon variant="light" color="red" onClick={() => onDelete(template)}>
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
