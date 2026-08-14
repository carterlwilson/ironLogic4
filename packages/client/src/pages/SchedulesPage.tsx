import { Container, Title, Text, Stack, Group, Tabs } from '@mantine/core';
import { IconCalendar, IconTemplate, IconCalendarEvent } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useScheduleTemplates } from '../hooks/useScheduleTemplates';
import { useActiveSchedule } from '../hooks/useActiveSchedule';
import { useCoaches } from '../hooks/useCoaches';
import { useClients } from '../hooks/useClients';
import { EmptyState } from '../components/schedules/shared/EmptyState';

// Template Tab Components
import {
  TemplateFormModal,
  DeleteTemplateModal,
} from '../components/schedules/TemplateTab';
import { ScheduleTemplateEditor } from '../components/schedules/TemplateEdit';

// Active Tab Components
import {
  ActiveToolbar,
  ActiveScheduleDisplay,
  CreateFromTemplateModal,
  ResetScheduleModal,
  DeleteScheduleModal,
} from '../components/schedules/ActiveTab';

/**
 * Schedules Page - Manage the gym's schedule template and active schedule
 *
 * Two tabs:
 * 1. Template - Create and manage the gym's single schedule template
 * 2. Active Schedule - View and manage the current active schedule
 */
export function SchedulesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('templates');

  // Redirect users who are not admin or owner
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Get gymId from user
  const gymId = user.gymId || '';

  // Fetch coaches
  const { coaches } = useCoaches(gymId);

  // Fetch clients once here (not per-timeslot) for use in the template editor
  const { clients, loading: clientsLoading } = useClients(gymId);

  // Schedule Template Management
  const {
    template,
    loading: templateLoading,
    isAddModalOpen,
    isDeleteModalOpen,
    loadTemplate,
    createTemplate,
    deleteTemplate,
    openAddModal,
    openDeleteModal,
    closeModals: closeTemplateModals,
  } = useScheduleTemplates();

  // Active Schedule Management
  const {
    activeSchedule,
    loading: activeLoading,
    isCreateModalOpen,
    isResetModalOpen,
    isDeleteModalOpen: isDeleteActiveModalOpen,
    loadActiveSchedule,
    createActiveSchedule,
    updateTimeslot,
    resetSchedule,
    deleteActiveSchedule,
    openCreateModal,
    openResetModal,
    openDeleteModal: openDeleteActiveModal,
    closeModals: closeActiveModals,
  } = useActiveSchedule();

  // Load data on mount and when gymId changes
  useEffect(() => {
    if (gymId) {
      loadTemplate();
      loadActiveSchedule();
    }
  }, [gymId]);

  // Handlers for template operations
  const handleCreateTemplate = async (data: any) => {
    await createTemplate(data);
  };

  const handleDeleteTemplate = async () => {
    if (template) {
      await deleteTemplate(template.id);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Page Header */}
        <Group gap="sm">
          <IconCalendar size={32} color="#3b82f6" />
          <Title order={1}>Schedule Management</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Manage your gym's schedule template and active schedule.
        </Text>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>
              Schedule Template
            </Tabs.Tab>
            <Tabs.Tab value="active" leftSection={<IconCalendarEvent size={16} />}>
              Active Schedule
            </Tabs.Tab>
          </Tabs.List>

          {/* Schedule Template Tab */}
          <Tabs.Panel value="templates" pt="xl">
            {template ? (
              <ScheduleTemplateEditor
                template={template}
                gymId={gymId}
                coaches={coaches}
                clients={clients}
                clientsLoading={clientsLoading}
                onDeleteRequest={openDeleteModal}
              />
            ) : (
              <EmptyState
                title="No Schedule Template"
                message="Create your gym's schedule template to get started."
                actionLabel="Create Template"
                onAction={openAddModal}
              />
            )}
          </Tabs.Panel>

          {/* Active Schedule Tab */}
          <Tabs.Panel value="active" pt="xl">
            <Stack gap="md">
              <ActiveToolbar
                hasActiveSchedule={!!activeSchedule}
                onCreateFromTemplate={openCreateModal}
                onReset={openResetModal}
                onDelete={openDeleteActiveModal}
              />

              {activeSchedule ? (
                <ActiveScheduleDisplay
                  schedule={activeSchedule}
                  coaches={coaches}
                  onUpdateTimeslot={updateTimeslot}
                />
              ) : (
                <EmptyState
                  title="No Active Schedule"
                  message="Create an active schedule from your template to get started."
                  actionLabel="Create from Template"
                  onAction={openCreateModal}
                />
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Template Modals */}
        <TemplateFormModal
          opened={isAddModalOpen}
          onClose={closeTemplateModals}
          onSubmit={handleCreateTemplate}
          loading={templateLoading}
        />

        <DeleteTemplateModal
          opened={isDeleteModalOpen}
          onClose={closeTemplateModals}
          template={template}
          onConfirm={handleDeleteTemplate}
          loading={templateLoading}
        />

        {/* Active Schedule Modals */}
        <CreateFromTemplateModal
          opened={isCreateModalOpen}
          onClose={closeActiveModals}
          template={template}
          onConfirm={createActiveSchedule}
          loading={activeLoading}
        />

        <ResetScheduleModal
          opened={isResetModalOpen}
          onClose={closeActiveModals}
          onConfirm={resetSchedule}
          loading={activeLoading}
        />

        <DeleteScheduleModal
          opened={isDeleteActiveModalOpen}
          onClose={closeActiveModals}
          onConfirm={deleteActiveSchedule}
          loading={activeLoading}
        />
      </Stack>
    </Container>
  );
}
