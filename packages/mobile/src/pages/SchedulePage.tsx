import { useState } from 'react';
import { Container, Title, Stack, Tabs, Center, Loader, Alert } from '@mantine/core';
import { useSchedule, FlatTimeslot } from '../hooks/useSchedule';
import { SlotList } from '../components/schedule/SlotList';
import { ConfirmLeaveModal } from '../components/schedule/ConfirmLeaveModal';

export const SchedulePage = () => {
  const { mySlots, availableSlots, loading, error, joinTimeslot, leaveTimeslot, actionLoading } = useSchedule();

  const [leaveModal, setLeaveModal] = useState<{ opened: boolean; slot: FlatTimeslot | null }>({
    opened: false,
    slot: null,
  });

  const openLeaveModal = (slot: FlatTimeslot) => {
    setLeaveModal({ opened: true, slot });
  };

  const closeLeaveModal = () => {
    setLeaveModal({ opened: false, slot: null });
  };

  const confirmLeave = async () => {
    if (!leaveModal.slot) return;
    await leaveTimeslot(leaveModal.slot);
    closeLeaveModal();
  };

  const showLoading = loading && mySlots.length === 0 && availableSlots.length === 0;

  return (
    <Container size="sm" py="md">
      <Stack gap="lg">
        <Title order={1}>Schedule</Title>

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {showLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <Tabs defaultValue="my">
            <Tabs.List grow mb="md">
              <Tabs.Tab value="my">My Slots</Tabs.Tab>
              <Tabs.Tab value="available">Available</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="my">
              <SlotList
                mode="my"
                slots={mySlots}
                actionLoading={actionLoading}
                onJoin={() => {}}
                onLeave={openLeaveModal}
              />
            </Tabs.Panel>

            <Tabs.Panel value="available">
              <SlotList
                mode="available"
                slots={availableSlots}
                actionLoading={actionLoading}
                onJoin={joinTimeslot}
                onLeave={() => {}}
              />
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>

      <ConfirmLeaveModal
        opened={leaveModal.opened}
        onClose={closeLeaveModal}
        onConfirm={confirmLeave}
        slot={leaveModal.slot}
        loading={leaveModal.slot ? (actionLoading[leaveModal.slot.timeslotId] ?? false) : false}
      />
    </Container>
  );
};
