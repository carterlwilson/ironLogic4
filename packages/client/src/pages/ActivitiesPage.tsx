import { Container, Title, Text, Stack, Group, Tabs } from '@mantine/core';
import { IconActivity, IconFolder, IconListDetails } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import React, { useState } from 'react';
import type { ActivityGroup } from '@ironlogic4/shared/types/activityGroups';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';
import { useActivityGroupManagement } from '../hooks/useActivityGroupManagement';
import { useActivityGroupSearch } from '../hooks/useActivityGroupSearch';
import { useActivityTemplateManagement } from '../hooks/useActivityTemplateManagement';
import { useActivityTemplateSearch } from '../hooks/useActivityTemplateSearch';
import { useBenchmarkTemplates } from '../hooks/useBenchmarkTemplates';

// Activity Group Components
import {
  ActivityGroupToolbar,
  ActivityGroupTable,
  AddActivityGroupModal,
  EditActivityGroupModal,
  DeleteActivityGroupModal,
} from '../components/admin/ActivityManagement/ActivityGroupTab';

// Activity Template Components
import {
  ActivityTemplateToolbar,
  ActivityTemplateTable,
  AddActivityTemplateModal,
  EditActivityTemplateModal,
  DeleteActivityTemplateModal,
} from '../components/admin/ActivityManagement/ActivityTemplateTab';

export function ActivitiesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>('groups');

  // Redirect users who are not admin or owner
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Get gymId from user
  const gymId = user.gymId || '';

  // Fetch benchmark templates once for the entire page
  const { templates: benchmarkTemplates, loading: benchmarksLoading } = useBenchmarkTemplates(gymId);

  // Activity Group Management
  const {
    activityGroups,
    loading: groupsLoading,
    pagination: groupsPagination,
    isAddModalOpen: isAddGroupModalOpen,
    isEditModalOpen: isEditGroupModalOpen,
    isDeleteModalOpen: isDeleteGroupModalOpen,
    selectedActivityGroup,
    openAddModal: openAddGroupModal,
    openEditModal: openEditGroupModal,
    openDeleteModal: openDeleteGroupModal,
    closeModals: closeGroupModals,
    createActivityGroup,
    updateActivityGroup,
    deleteActivityGroup,
    loadActivityGroups,
  } = useActivityGroupManagement();

  const {
    searchQuery: groupSearchQuery,
    hasFilters: hasGroupFilters,
    setSearchQuery: setGroupSearchQuery,
    clearFilters: clearGroupFilters,
    page: groupPage,
    pageSize: groupPageSize,
    setPage: setGroupPage,
    setPageSize: setGroupPageSize,
    queryParams: groupQueryParams,
  } = useActivityGroupSearch();

  // Activity Template Management
  const {
    activityTemplates,
    loading: templatesLoading,
    pagination: templatesPagination,
    isAddModalOpen: isAddTemplateModalOpen,
    isEditModalOpen: isEditTemplateModalOpen,
    isDeleteModalOpen: isDeleteTemplateModalOpen,
    selectedActivityTemplate,
    openAddModal: openAddTemplateModal,
    openEditModal: openEditTemplateModal,
    openDeleteModal: openDeleteTemplateModal,
    closeModals: closeTemplateModals,
    createActivityTemplate,
    updateActivityTemplate,
    deleteActivityTemplate,
    loadActivityTemplates,
  } = useActivityTemplateManagement();

  const {
    searchQuery: templateSearchQuery,
    typeFilter,
    groupFilter,
    hasFilters: hasTemplateFilters,
    setSearchQuery: setTemplateSearchQuery,
    setTypeFilter,
    setGroupFilter,
    clearFilters: clearTemplateFilters,
    page: templatePage,
    pageSize: templatePageSize,
    setPage: setTemplatePage,
    setPageSize: setTemplatePageSize,
    queryParams: templateQueryParams,
  } = useActivityTemplateSearch();

  // Transform activity groups into options for template dropdowns
  const groupOptions = activityGroups.map(group => ({
    value: group.id,
    label: group.name,
  }));

  // Load activity groups when filters change
  React.useEffect(() => {
    if (gymId) {
      loadActivityGroups({ ...groupQueryParams, gymId });
    }
  }, [groupSearchQuery, groupPage, groupPageSize, gymId]);

  // Load activity templates when filters change
  React.useEffect(() => {
    if (gymId) {
      loadActivityTemplates({ ...templateQueryParams, gymId });
    }
  }, [templateSearchQuery, typeFilter, groupFilter, templatePage, templatePageSize, gymId]);

  const handleCreateGroup = async (data: any) => {
    await createActivityGroup(data);
  };

  const handleUpdateGroup = async (groupId: string, data: any) => {
    await updateActivityGroup(groupId, data);
  };

  const handleDeleteGroup = async (group: ActivityGroup) => {
    await deleteActivityGroup(group.id);
  };

  const handleCreateTemplate = async (data: any) => {
    await createActivityTemplate(data);
  };

  const handleUpdateTemplate = async (templateId: string, data: any) => {
    await updateActivityTemplate(templateId, data);
  };

  const handleDeleteTemplate = async (template: ActivityTemplate) => {
    await deleteActivityTemplate(template.id);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Page Header */}
        <Group gap="sm">
          <IconActivity size={32} color="#22c55e" />
          <Title order={1}>Activity Management</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Manage activity groups and templates for your gym.
        </Text>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="groups" leftSection={<IconFolder size={16} />}>
              Activity Groups
            </Tabs.Tab>
            <Tabs.Tab value="templates" leftSection={<IconListDetails size={16} />}>
              Activity Templates
            </Tabs.Tab>
          </Tabs.List>

          {/* Activity Groups Tab */}
          <Tabs.Panel value="groups" pt="xl">
            <Stack gap="md">
              <ActivityGroupToolbar
                searchQuery={groupSearchQuery}
                hasFilters={hasGroupFilters}
                onSearchChange={setGroupSearchQuery}
                onClearFilters={clearGroupFilters}
                onAddGroup={openAddGroupModal}
              />

              <ActivityGroupTable
                groups={activityGroups}
                loading={groupsLoading}
                pagination={groupsPagination}
                hasFilters={hasGroupFilters}
                onEdit={openEditGroupModal}
                onDelete={openDeleteGroupModal}
                onPageChange={setGroupPage}
                onPageSizeChange={setGroupPageSize}
                onAddGroup={openAddGroupModal}
                onClearFilters={clearGroupFilters}
              />
            </Stack>
          </Tabs.Panel>

          {/* Activity Templates Tab */}
          <Tabs.Panel value="templates" pt="xl">
            <Stack gap="md">
              <ActivityTemplateToolbar
                searchQuery={templateSearchQuery}
                typeFilter={typeFilter}
                groupFilter={groupFilter}
                hasFilters={hasTemplateFilters}
                onSearchChange={setTemplateSearchQuery}
                onTypeFilterChange={setTypeFilter}
                onGroupFilterChange={setGroupFilter}
                onClearFilters={clearTemplateFilters}
                onAddTemplate={openAddTemplateModal}
                groupOptions={groupOptions}
                groupsLoading={groupsLoading}
              />

              <ActivityTemplateTable
                templates={activityTemplates}
                groups={activityGroups}
                loading={templatesLoading}
                pagination={templatesPagination}
                hasFilters={hasTemplateFilters}
                onEdit={openEditTemplateModal}
                onDelete={openDeleteTemplateModal}
                onPageChange={setTemplatePage}
                onPageSizeChange={setTemplatePageSize}
                onAddTemplate={openAddTemplateModal}
                onClearFilters={clearTemplateFilters}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Activity Group Modals */}
        <AddActivityGroupModal
          opened={isAddGroupModalOpen}
          onClose={closeGroupModals}
          onSubmit={handleCreateGroup}
          loading={groupsLoading}
          gymId={gymId}
        />

        <EditActivityGroupModal
          opened={isEditGroupModalOpen}
          onClose={closeGroupModals}
          group={selectedActivityGroup}
          onSubmit={handleUpdateGroup}
          onDelete={openDeleteGroupModal}
          loading={groupsLoading}
        />

        <DeleteActivityGroupModal
          opened={isDeleteGroupModalOpen}
          onClose={closeGroupModals}
          group={selectedActivityGroup}
          onConfirm={handleDeleteGroup}
          loading={groupsLoading}
        />

        {/* Activity Template Modals */}
        <AddActivityTemplateModal
          opened={isAddTemplateModalOpen}
          onClose={closeTemplateModals}
          onSubmit={handleCreateTemplate}
          loading={templatesLoading}
          gymId={gymId}
          groupOptions={groupOptions}
          groupsLoading={groupsLoading}
          benchmarkTemplates={benchmarkTemplates}
          benchmarksLoading={benchmarksLoading}
        />

        <EditActivityTemplateModal
          opened={isEditTemplateModalOpen}
          onClose={closeTemplateModals}
          template={selectedActivityTemplate}
          onSubmit={handleUpdateTemplate}
          onDelete={openDeleteTemplateModal}
          loading={templatesLoading}
          groupOptions={groupOptions}
          groupsLoading={groupsLoading}
          benchmarkTemplates={benchmarkTemplates}
          benchmarksLoading={benchmarksLoading}
        />

        <DeleteActivityTemplateModal
          opened={isDeleteTemplateModalOpen}
          onClose={closeTemplateModals}
          template={selectedActivityTemplate}
          onConfirm={handleDeleteTemplate}
          loading={templatesLoading}
        />
      </Stack>
    </Container>
  );
}