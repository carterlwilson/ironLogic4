import { useState, useMemo } from 'react';
import { Modal, TextInput, Stack, ScrollArea, UnstyledButton, Text, Group } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import type { DirectoryClient } from '../../hooks/useClientDirectory';

interface AddClientModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (clientId: string) => void;
  clients: DirectoryClient[];
  loading: boolean;
  alreadyAssignedIds: string[];
}

export function AddClientModal({ opened, onClose, onSelect, clients, loading, alreadyAssignedIds }: AddClientModalProps) {
  const [search, setSearch] = useState('');

  const availableClients = useMemo(
    () => clients.filter((c) => !alreadyAssignedIds.includes(c.id)),
    [clients, alreadyAssignedIds]
  );

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableClients;
    return availableClients.filter((c) => {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      return name.includes(query) || c.email.toLowerCase().includes(query);
    });
  }, [availableClients, search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Add Client" size="sm" centered>
      <Stack gap="sm">
        <TextInput
          placeholder="Search clients..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          disabled={loading}
        />

        <ScrollArea.Autosize mah={360}>
          <Stack gap={4}>
            {filteredClients.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                No clients found
              </Text>
            ) : (
              filteredClients.map((client) => (
                <UnstyledButton
                  key={client.id}
                  onClick={() => onSelect(client.id)}
                  disabled={loading}
                  p="xs"
                  style={{ borderRadius: 6 }}
                >
                  <Group justify="space-between">
                    <Text size="sm">
                      {client.firstName && client.lastName ? `${client.firstName} ${client.lastName}` : client.email}
                    </Text>
                  </Group>
                </UnstyledButton>
              ))
            )}
          </Stack>
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
}
