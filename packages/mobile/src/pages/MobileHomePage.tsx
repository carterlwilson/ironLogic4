import { Container, Text, Paper, Group, Badge } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';

export function MobileHomePage() {
  const { user } = useAuth();

  return (
    <Container size="sm" py="xl">
      {user && (
        <Paper shadow="sm" p="lg" radius="md" withBorder mb="lg">
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

      <img
        src="/CullyLP.png"
        alt="Cully Strength"
        style={{ maxWidth: '480px', width: '100%', borderRadius: '12px', display: 'block', margin: '0 auto' }}
      />
    </Container>
  );
}
