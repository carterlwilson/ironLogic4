import { Modal, Stack, Group, TextInput, Select, Button } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBuilding, IconMapPin, IconPhone, IconUser } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import type { CreateGymRequest } from '@ironlogic4/shared/types/gyms';
import { userApi } from '../../../services/userApi';

interface AddGymModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGymRequest) => Promise<void>;
  loading?: boolean;
}

export function AddGymModal({ opened, onClose, onSubmit, loading = false }: AddGymModalProps) {
  const [owners, setOwners] = useState<{ value: string; label: string }[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);

  const form = useForm<CreateGymRequest>({
    initialValues: {
      name: '',
      address: '',
      phoneNumber: '',
      ownerId: '',
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

  const handleSubmit = async (values: CreateGymRequest) => {
    try {
      await onSubmit(values);
      form.reset();
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add New Gym"
      size="md"
      centered
    >
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
              color="green"
              loading={loading}
              disabled={!form.isValid() || loadingOwners}
            >
              Create Gym
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}