import { Modal, Tabs, Stack, Group, TextInput, Select, Button, Text, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBuilding, IconMapPin, IconPhone, IconUser, IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import React, { useState, useEffect } from 'react';
import type { Gym, UpdateGymRequest } from '@ironlogic4/shared/types/gyms';
import { userApi } from '../../../services/userApi';

interface EditGymModalProps {
  opened: boolean;
  onClose: () => void;
  gym: Gym | null;
  onSubmit: (gymId: string, data: UpdateGymRequest) => Promise<void>;
  onDelete: (gym: Gym) => void;
  loading?: boolean;
}

export function EditGymModal({ opened, onClose, gym, onSubmit, onDelete, loading = false }: EditGymModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>('info');
  const [owners, setOwners] = useState<{ value: string; label: string }[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  const form = useForm<UpdateGymRequest>({
    initialValues: {
      name: gym?.name || '',
      address: gym?.address || '',
      phoneNumber: gym?.phoneNumber || '',
      ownerId: gym?.ownerId || '',
    },
    validate: {
      name: (value) => {
        if (!value?.trim()) return 'Gym name is required';
        if (value.trim().length < 1) return 'Gym name must be at least 1 character';
        return null;
      },
      address: (value) => {
        if (!value?.trim()) return 'Address is required';
        if (value.trim().length < 5) return 'Address must be at least 5 characters';
        return null;
      },
      phoneNumber: (value) => {
        if (!value?.trim()) return 'Phone number is required';
        if (!/^[\+\-\s\(\)\d]+$/.test(value)) return 'Please enter a valid phone number';
        return null;
      },
      ownerId: (value) => {
        if (!value) return 'Owner is required';
        return null;
      },
    },
  });

  // Load owners when modal opens
  useEffect(() => {
    if (opened) {
      loadOwners();
    }
  }, [opened]);

  const loadOwners = async () => {
    try {
      setLoadingOwners(true);
      const response = await userApi.getUsers({ role: 'owner', limit: 100 });
      const ownerOptions = (response.data || []).map(user => ({
        value: user.id,
        label: `${user.firstName} ${user.lastName} (${user.email})`,
      }));
      setOwners(ownerOptions);
    } catch (error) {
      console.error('Failed to load owners:', error);
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  };

  // Reset form when gym changes
  React.useEffect(() => {
    if (gym) {
      form.setValues({
        name: gym.name,
        address: gym.address,
        phoneNumber: gym.phoneNumber,
        ownerId: gym.ownerId,
      });
      form.resetDirty();
    }
    setActiveTab('info');
  }, [gym]);

  const handleSubmit = async (values: UpdateGymRequest) => {
    if (!gym) return;

    try {
      await onSubmit(gym.id, values);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    setActiveTab('info');
    onClose();
  };

  const handleDelete = () => {
    if (gym) {
      onDelete(gym);
    }
  };

  if (!gym) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Edit Gym: ${gym.name}`}
      size="md"
      centered
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="info">Gym Information</Tabs.Tab>
          <Tabs.Tab value="danger">Danger Zone</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="info" pt="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              {/* Gym Information */}
              <TextInput
                label="Gym Name"
                placeholder="Enter gym name"
                leftSection={<IconBuilding size={16} />}
                required
                {...form.getInputProps('name')}
              />

              <TextInput
                label="Address"
                placeholder="Enter gym address"
                leftSection={<IconMapPin size={16} />}
                required
                {...form.getInputProps('address')}
              />

              <TextInput
                label="Phone Number"
                placeholder="Enter phone number"
                leftSection={<IconPhone size={16} />}
                required
                {...form.getInputProps('phoneNumber')}
              />

              <Select
                label="Owner"
                placeholder={loadingOwners ? "Loading owners..." : "Select gym owner"}
                leftSection={<IconUser size={16} />}
                data={owners}
                searchable
                disabled={loadingOwners}
                required
                {...form.getInputProps('ownerId')}
              />

              {/* Actions */}
              <Group justify="flex-end" gap="md" mt="md">
                <Button
                  variant="subtle"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="blue"
                  loading={loading}
                  disabled={!form.isValid() || !form.isDirty() || loadingOwners}
                >
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="danger" pt="md">
          <Stack gap="md">
            <Alert
              color="red"
              icon={<IconAlertTriangle size={16} />}
              title="Danger Zone"
            >
              <Text size="sm">
                Once you delete this gym, there is no going back. This action cannot be undone.
              </Text>
            </Alert>

            <Stack gap="xs">
              <Text fw={500}>Delete Gym</Text>
              <Text size="sm" c="dimmed">
                This will permanently delete "{gym.name}" and remove all associated data.
                This action cannot be undone.
              </Text>
            </Stack>

            <Group justify="flex-end">
              <Button
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleDelete}
              >
                Delete Gym
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}