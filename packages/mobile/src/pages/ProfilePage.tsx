import { useState, useCallback } from 'react';
import { Container, Stack, Paper, Group, Text, Badge, Button } from '@mantine/core';
import { IconLogout, IconUser } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { ConfirmLogoutModal } from '../components/ConfirmLogoutModal';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [logoutModalOpened, setLogoutModalOpened] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    setLogoutModalOpened(false);
  }, [logout]);

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        {/* User Information Card */}
        {user && (
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <IconUser size={32} stroke={1.5} />
                <div>
                  <Text fw={500} size="lg">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {user.email}
                  </Text>
                </div>
              </Group>
              <Badge color="forestGreen" variant="light" size="lg">
                {user.role}
              </Badge>
            </Group>
          </Paper>
        )}

        {/* App Information Card */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Text fw={500}>App Information</Text>
            <Text size="sm" c="dimmed">Version: 1.0.0</Text>
            <Text size="sm" c="dimmed">Build: Mobile PWA</Text>
          </Stack>
        </Paper>

        {/* Logout Button */}
        <Button
          variant="filled"
          color="red"
          size="lg"
          fullWidth
          leftSection={<IconLogout size={20} />}
          onClick={() => setLogoutModalOpened(true)}
        >
          Logout
        </Button>
      </Stack>

      {/* Logout Confirmation Modal */}
      <ConfirmLogoutModal
        opened={logoutModalOpened}
        onClose={() => setLogoutModalOpened(false)}
        onConfirm={handleLogout}
      />
    </Container>
  );
}