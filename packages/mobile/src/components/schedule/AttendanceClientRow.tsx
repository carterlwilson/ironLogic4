import { Group, Text, SegmentedControl } from '@mantine/core';

interface AttendanceClientRowProps {
  client: { id: string; firstName: string; lastName: string };
  status: 'present' | 'absent' | 'late';
  onSetStatus: (status: 'present' | 'absent' | 'late') => void;
}

export function AttendanceClientRow({ client, status, onSetStatus }: AttendanceClientRowProps) {
  return (
    <Group justify="space-between" align="center" py="xs">
      <Text size="sm">{client.firstName} {client.lastName}</Text>
      <SegmentedControl
        size="xs"
        value={status}
        onChange={(v) => onSetStatus(v as 'present' | 'absent' | 'late')}
        data={[
          { value: 'present', label: '✓' },
          { value: 'absent', label: '✗' },
          { value: 'late', label: 'Late' },
        ]}
      />
    </Group>
  );
}
