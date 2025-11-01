import { Table, Group, ActionIcon, Tooltip, Text, Badge } from '@mantine/core';
import { IconEdit, IconTrash, IconBarbell } from '@tabler/icons-react';
import type { User } from '@ironlogic4/shared/types/users';
import { useNavigate } from 'react-router-dom';
import { useProgram } from '../../hooks/usePrograms';

interface ClientRowProps {
  client: User;
  onEdit: (client: User) => void;
  onDelete: (client: User) => void;
}

export function ClientRow({ client, onEdit, onDelete }: ClientRowProps) {
  const navigate = useNavigate();
  const { data: programData } = useProgram(client.programId);

  const handleManageBenchmarks = () => {
    navigate(`/clients/${client.id}/benchmarks`);
  };

  return (
    <Table.Tr>
      <Table.Td>
        <Text fw={500}>
          {client.firstName} {client.lastName}
        </Text>
      </Table.Td>
      <Table.Td>{client.email}</Table.Td>
      <Table.Td>
        {client.programId && programData?.data ? (
          <Badge variant="light" color="forestGreen">
            {programData.data.name}
          </Badge>
        ) : (
          <Text size="sm" c="dimmed">
            No program
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        {client.currentBenchmarks?.length || 0} current / {client.historicalBenchmarks?.length || 0} historical
      </Table.Td>
      <Table.Td>
        {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Manage Benchmarks">
            <ActionIcon
              variant="light"
              color="forestGreen"
              onClick={handleManageBenchmarks}
            >
              <IconBarbell size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Edit Client">
            <ActionIcon
              variant="light"
              color="forestGreen"
              onClick={() => onEdit(client)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete Client">
            <ActionIcon
              variant="light"
              color="red"
              onClick={() => onDelete(client)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}