import { useState } from 'react';
import { Container, Title, Stack, Tabs, Center, Loader, Alert } from '@mantine/core';
import { useClientDirectory } from '../../hooks/useClientDirectory';
import { useCoachTemplate } from '../../hooks/useCoachTemplate';
import { useCoachActiveSchedule } from '../../hooks/useCoachActiveSchedule';
import type { FlatCoachTimeslot } from '../../utils/coachScheduleUtils';
import { CoachSlotList } from './CoachSlotList';
import { AddClientModal } from './AddClientModal';

type ScheduleSource = 'template' | 'active';

export function CoachScheduleView() {
  const { clients, clientMap, loading: clientsLoading } = useClientDirectory();
  const template = useCoachTemplate(clientMap);
  const active = useCoachActiveSchedule(clientMap);

  const [addModal, setAddModal] = useState<{ slot: FlatCoachTimeslot; source: ScheduleSource } | null>(null);

  const openAddModal = (slot: FlatCoachTimeslot, source: ScheduleSource) => {
    setAddModal({ slot, source });
  };

  const closeAddModal = () => setAddModal(null);

  const handleSelectClient = async (clientId: string) => {
    if (!addModal) return;
    const hook = addModal.source === 'template' ? template : active;
    await hook.addClient(addModal.slot, clientId);
    closeAddModal();
  };

  const showLoading =
    clientsLoading && template.loading && active.loading &&
    template.slots.length === 0 && active.slots.length === 0;

  return (
    <Container size="sm" py="md">
      <Stack gap="lg">
        <Title order={1}>Schedule</Title>

        {(template.error || active.error) && (
          <Alert color="red" title="Error">
            {template.error || active.error}
          </Alert>
        )}

        {showLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <Tabs defaultValue="template">
            <Tabs.List grow mb="md">
              <Tabs.Tab value="template">Weekly Template</Tabs.Tab>
              <Tabs.Tab value="active">Active Schedule</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="template">
              <CoachSlotList
                slots={template.slots}
                actionLoading={template.actionLoading}
                onAddClient={(slot) => openAddModal(slot, 'template')}
                onRemoveClient={(slot, clientId) => template.removeClient(slot, clientId)}
                emptyMessage="You don't coach any timeslots on the weekly template yet"
              />
            </Tabs.Panel>

            <Tabs.Panel value="active">
              <CoachSlotList
                slots={active.slots}
                actionLoading={active.actionLoading}
                onAddClient={(slot) => openAddModal(slot, 'active')}
                onRemoveClient={(slot, clientId) => active.removeClient(slot, clientId)}
                emptyMessage="You don't coach any timeslots on the active schedule yet"
              />
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>

      <AddClientModal
        opened={addModal !== null}
        onClose={closeAddModal}
        onSelect={handleSelectClient}
        clients={clients}
        loading={addModal ? ((addModal.source === 'template' ? template.actionLoading : active.actionLoading)[addModal.slot.timeslotId] ?? false) : false}
        alreadyAssignedIds={addModal ? addModal.slot.assignedClients.map((c) => c.id) : []}
      />
    </Container>
  );
}
