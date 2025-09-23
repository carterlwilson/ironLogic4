import { Container, Title, Text, Stack, Card, Group, Button } from '@mantine/core';
import { IconUsers, IconUserPlus } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';

export function UsersPage() {
  const { user } = useAuth();

  // Redirect non-admin users
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Page Header */}
        <Group gap="sm">
          <IconUsers size={32} color="#22c55e" />
          <Title order={1}>Users Management</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Manage user accounts and permissions for your organization.
        </Text>

        {/* Placeholder Content */}
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Stack gap="md" align="center" py="xl">
            <IconUserPlus size={48} color="#22c55e" />
            <Title order={3} ta="center">
              Users Management
            </Title>
            <Text ta="center" c="dimmed" maw={400}>
              This is a placeholder for the users management interface. Here you would be able to:
            </Text>

            <Stack gap="xs" mt="md">
              <Text size="sm">• View all users in the system</Text>
              <Text size="sm">• Create new user accounts</Text>
              <Text size="sm">• Edit user permissions and roles</Text>
              <Text size="sm">• Deactivate or delete user accounts</Text>
              <Text size="sm">• Manage user access levels</Text>
            </Stack>

            <Button
              variant="outline"
              color="green"
              mt="lg"
              leftSection={<IconUserPlus size={16} />}
              disabled
            >
              Add New User (Coming Soon)
            </Button>
          </Stack>
        </Card>

        {/* Admin Notice */}
        <Card shadow="sm" padding="lg" radius="md" withBorder bg="green.0">
          <Group gap="sm">
            <IconUsers size={20} color="#22c55e" />
            <div>
              <Text fw={500} size="sm">
                Admin Access Required
              </Text>
              <Text size="xs" c="dimmed">
                This page is only accessible to users with administrator privileges.
              </Text>
            </div>
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}