import { Container, Title, Text, Stack, Paper, Group, Badge } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { useAppTitle } from '../hooks/useAppTitle';

export function MobileHomePage() {
  const { user } = useAuth();
  const appTitle = useAppTitle();

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        {user && (
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <IconUser size={24} />
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
                Client
              </Badge>
            </Group>
          </Paper>
        )}

        <Title order={1} size="h2" ta="center">
          Welcome to {appTitle}
        </Title>

        <Text size="md" ta="center" c="dimmed">
          Your mobile training companion
        </Text>
      </Stack>
    </Container>
  );
}