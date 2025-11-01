import { Container, Title, Text, Stack, Group, Tabs } from '@mantine/core';
import { IconCalendar, IconTemplate, IconCalendarEvent } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useScheduleTemplates } from '../hooks/useScheduleTemplates';
import { useActiveSchedule } from '../hooks/useActiveSchedule';
import { useCoaches } from '../hooks/useCoaches';
import { EmptyState } from '../components/schedules/shared/EmptyState';

// Template Tab Components
import {
  TemplateToolbar,
  TemplateTable,
  TemplateFormModal,
  DeleteTemplateModal,
} from '../components/schedules/TemplateTab';

// Active Tab Components
import {
  ActiveToolbar,
  ActiveScheduleDisplay,
  CreateFromTemplateModal,
  EditCoachesModal,
  ResetScheduleModal,
  DeleteScheduleModal,
} from '../components/schedules/ActiveTab';

/**
 * Schedules Page - Manage schedule templates and active schedules
 *
 * Two tabs:
 * 1. Templates - Create and manage schedule templates
 * 2. Active Schedule - View and manage the current active schedule
 */
export function SchedulesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('templates');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect users who are not admin or owner
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Get gymId from user
  const gymId = user.gymId || '';

  // Fetch coaches
  const { coaches, loading: coachesLoading } = useCoaches(gymId);

  // Schedule Templates Management
  const {
    templates,
    loading: templatesLoading,
    isAddModalOpen,
    isDeleteModalOpen,
    selectedTemplate,
    loadTemplates,
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
    isEditCoachesModalOpen,
    isResetModalOpen,
    isDeleteModalOpen: isDeleteActiveModalOpen,
    loadActiveSchedule,
    createActiveSchedule,
    updateCoaches,
    resetSchedule,
    deleteActiveSchedule,
    openCreateModal,
    openEditCoachesModal,
    openResetModal,
    openDeleteModal: openDeleteActiveModal,
    closeModals: closeActiveModals,
  } = useActiveSchedule();

  // Load data on mount and when gymId changes
  useEffect(() => {
    if (gymId) {
      loadTemplates();
      loadActiveSchedule();
    }
  }, [gymId]);

  // Filter templates by search query
  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers for template operations
  const handleCreateTemplate = async (data: any) => {
    await createTemplate(data);
  };

  const handleEditTemplate = (template: any) => {
    navigate(`/schedules/templates/${template.id}/edit`);
  };

  const handleDeleteTemplate = async (template: any) => {
    await deleteTemplate(template.id);
  };

  // Handlers for active schedule operations
  const handleCreateActiveSchedule = async (templateId: string) => {
    await createActiveSchedule({ templateId });
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
          Manage schedule templates and active schedules for your gym.
        </Text>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>
              Schedule Templates
            </Tabs.Tab>
            <Tabs.Tab value="active" leftSection={<IconCalendarEvent size={16} />}>
              Active Schedule
            </Tabs.Tab>
          </Tabs.List>

          {/* Schedule Templates Tab */}
          <Tabs.Panel value="templates" pt="xl">
            <Stack gap="md">
              <TemplateToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddTemplate={openAddModal}
              />

              <TemplateTable
                templates={filteredTemplates}
                loading={templatesLoading}
                onEdit={handleEditTemplate}
                onDelete={openDeleteModal}
                onAddTemplate={openAddModal}
              />
            </Stack>
          </Tabs.Panel>

          {/* Active Schedule Tab */}
          <Tabs.Panel value="active" pt="xl">
            <Stack gap="md">
              <ActiveToolbar
                hasActiveSchedule={!!activeSchedule}
                onCreateFromTemplate={openCreateModal}
                onEditCoaches={openEditCoachesModal}
                onReset={openResetModal}
                onDelete={openDeleteActiveModal}
              />

              {activeSchedule ? (
                <ActiveScheduleDisplay
                  schedule={activeSchedule}
                  coaches={coaches}
                />
              ) : (
                <EmptyState
                  title="No Active Schedule"
                  message="Create an active schedule from a template to get started."
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
          loading={templatesLoading}
          coaches={coaches}
          coachesLoading={coachesLoading}
        />

        <DeleteTemplateModal
          opened={isDeleteModalOpen}
          onClose={closeTemplateModals}
          template={selectedTemplate}
          onConfirm={handleDeleteTemplate}
          loading={templatesLoading}
        />

        {/* Active Schedule Modals */}
        <CreateFromTemplateModal
          opened={isCreateModalOpen}
          onClose={closeActiveModals}
          templates={templates}
          onConfirm={handleCreateActiveSchedule}
          loading={activeLoading}
          coaches={coaches}
        />

        <EditCoachesModal
          opened={isEditCoachesModalOpen}
          onClose={closeActiveModals}
          schedule={activeSchedule}
          coaches={coaches}
          onConfirm={updateCoaches}
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