import { useState, useEffect, useCallback } from 'react';
import { Container, Title, Text, Stack, Group, Tabs } from '@mantine/core';
import { IconCalendar, IconTemplate, IconCalendarEvent, IconCalendarPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import type { IScheduleTemplate } from '@ironlogic4/shared';
import { scheduleApi } from '../services/scheduleApi';
import { useCoaches } from '../hooks/useCoaches';
import { GenerateSessionsPanel } from '../components/schedules/GenerateTab/GenerateSessionsPanel';
import { SessionsWeekView } from '../components/schedules/SessionsTab';
import {
  TemplateToolbar,
  TemplateTable,
  TemplateFormModal,
  DeleteTemplateModal,
} from '../components/schedules/TemplateTab';
import type { CreateScheduleTemplateRequest, UpdateScheduleTemplateRequest } from '@ironlogic4/shared';

export function SchedulesPage() {
  const { user } = useAuth();

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <Navigate to="/dashboard" replace />;
  }

  const gymId = user.gymId || '';
  const { coaches, loading: coachesLoading } = useCoaches(gymId);

  // Template state
  const [templates, setTemplates] = useState<IScheduleTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IScheduleTemplate | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<IScheduleTemplate | null>(null);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await scheduleApi.getTemplates();
      setTemplates(res.data ?? []);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to load templates',
        color: 'red',
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    if (!searchQuery) return true;
    const coach = coaches.find(c => c.id === t.coachId);
    const coachName = coach ? `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim() : '';
    return (
      coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][t.dayOfWeek]
        .toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Template CRUD handlers
  const handleCreateOrUpdate = async (data: CreateScheduleTemplateRequest | UpdateScheduleTemplateRequest) => {
    try {
      if (editingTemplate) {
        await scheduleApi.updateTemplate(editingTemplate.id, data as UpdateScheduleTemplateRequest);
        notifications.show({ title: 'Updated', message: 'Template updated', color: 'green' });
      } else {
        await scheduleApi.createTemplate(data as CreateScheduleTemplateRequest);
        notifications.show({ title: 'Created', message: 'Template created', color: 'green' });
      }
      await loadTemplates();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to save template',
        color: 'red',
      });
      throw err;
    }
  };

  const handleToggleActive = async (template: IScheduleTemplate) => {
    try {
      await scheduleApi.updateTemplate(template.id, { isActive: !template.isActive });
      notifications.show({
        title: template.isActive ? 'Deactivated' : 'Activated',
        message: `Template ${template.isActive ? 'deactivated' : 'activated'}`,
        color: template.isActive ? 'orange' : 'green',
      });
      await loadTemplates();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to update template',
        color: 'red',
      });
    }
  };

  const handleDeleteTemplate = async (template: IScheduleTemplate) => {
    try {
      await scheduleApi.deleteTemplate(template.id);
      notifications.show({ title: 'Deleted', message: 'Template deleted', color: 'blue' });
      await loadTemplates();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to delete template',
        color: 'red',
      });
      throw err;
    }
  };

  const openAdd = () => { setEditingTemplate(null); setFormModalOpen(true); };
  const openEdit = (t: IScheduleTemplate) => { setEditingTemplate(t); setFormModalOpen(true); };
  const openDelete = (t: IScheduleTemplate) => { setDeletingTemplate(t); setDeleteModalOpen(true); };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group gap="sm">
          <IconCalendar size={32} color="#3b82f6" />
          <Title order={1}>Schedule Management</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Manage class templates, view sessions, and generate weekly schedules.
        </Text>

        <Tabs defaultValue="templates">
          <Tabs.List>
            <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>
              Templates
            </Tabs.Tab>
            <Tabs.Tab value="sessions" leftSection={<IconCalendarEvent size={16} />}>
              Sessions
            </Tabs.Tab>
            <Tabs.Tab value="generate" leftSection={<IconCalendarPlus size={16} />}>
              Generate
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="templates" pt="xl">
            <Stack gap="md">
              <TemplateToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddTemplate={openAdd}
              />
              <TemplateTable
                templates={filteredTemplates}
                loading={templatesLoading}
                coaches={coaches}
                onEdit={openEdit}
                onDelete={openDelete}
                onToggleActive={handleToggleActive}
                onAddTemplate={openAdd}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="sessions" pt="xl">
            <SessionsWeekView coaches={coaches} templates={templates} />
          </Tabs.Panel>

          <Tabs.Panel value="generate" pt="xl">
            <GenerateSessionsPanel />
          </Tabs.Panel>
        </Tabs>

        <TemplateFormModal
          opened={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          onSubmit={handleCreateOrUpdate}
          loading={templatesLoading}
          coaches={coaches}
          coachesLoading={coachesLoading}
          editingTemplate={editingTemplate}
        />

        <DeleteTemplateModal
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          template={deletingTemplate}
          onConfirm={handleDeleteTemplate}
          loading={templatesLoading}
        />
      </Stack>
    </Container>
  );
}
