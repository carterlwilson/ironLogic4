import { Container, Title, Text, Button, Stack, Group, Card, Grid } from '@mantine/core';
import { IconUser, IconLogout } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    logout();
    // Navigate to login page after logout
    navigate('/', { replace: true });
  };

  return (
    <Container size="lg">
      <Stack gap="xl">
        {/* Header with user info and logout */}
        <Group justify="space-between">
          <Group gap="sm">
            <IconUser size={24} color="#22c55e" />
            <div>
              <Title order={2}>Welcome, {user?.firstName || user?.email}</Title>
              <Text size="sm" c="dimmed">
                Role: {user?.role} • {user?.email}
              </Text>
            </div>
          </Group>
          <Button
            variant="outline"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Group>

        {/* Dashboard Content */}
        <Title order={1}>IronLogic4 Dashboard</Title>

        <Text size="lg" c="dimmed">
          You are successfully authenticated and can now access the application.
        </Text>

        {/* Placeholder Dashboard Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Users</Title>
              <Text size="sm" c="dimmed">
                Manage user accounts and permissions
              </Text>
              <Button variant="light" color="green" fullWidth mt="md">
                View Users
              </Button>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Reports</Title>
              <Text size="sm" c="dimmed">
                View analytics and generate reports
              </Text>
              <Button variant="light" color="green" fullWidth mt="md">
                View Reports
              </Button>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Settings</Title>
              <Text size="sm" c="dimmed">
                Configure application settings
              </Text>
              <Button variant="light" color="green" fullWidth mt="md">
                View Settings
              </Button>
            </Card>
          </Grid.Col>
        </Grid>

        {/* User Role Information */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={4} mb="md">Your Permissions</Title>
          <Text size="sm">
            As a <strong>{user?.role}</strong>, you have access to:
          </Text>
          <Stack gap="xs" mt="sm">
            {user?.role === 'admin' && (
              <>
                <Text size="sm">• Full system administration</Text>
                <Text size="sm">• User management</Text>
                <Text size="sm">• All reports and analytics</Text>
              </>
            )}
            {user?.role === 'owner' && (
              <>
                <Text size="sm">• Business management</Text>
                <Text size="sm">• Coach and client management</Text>
                <Text size="sm">• Business reports</Text>
              </>
            )}
            {user?.role === 'coach' && (
              <>
                <Text size="sm">• Client management</Text>
                <Text size="sm">• Client reports</Text>
                <Text size="sm">• Training programs</Text>
              </>
            )}
            {user?.role === 'client' && (
              <>
                <Text size="sm">• Personal dashboard</Text>
                <Text size="sm">• Training progress</Text>
                <Text size="sm">• Personal reports</Text>
              </>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}