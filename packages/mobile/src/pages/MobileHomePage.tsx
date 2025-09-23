import { Container, Title, Text, Button, Stack, Card } from '@mantine/core';
import { IconDeviceMobile, IconOffline, IconBell } from '@tabler/icons-react';

export function MobileHomePage() {
  const handleInstallPWA = () => {
    // PWA installation logic would go here
    console.log('Install PWA');
  };

  return (
    <Container size="sm" p="md">
      <Stack gap="lg">
        <Title order={1} size="h2" ta="center">
          Welcome to IronLogic4 Mobile
        </Title>

        <Text size="md" ta="center" c="dimmed">
          Your mobile-optimized PWA experience
        </Text>

        <Stack gap="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="sm" align="center">
              <IconDeviceMobile size={32} />
              <Text fw={500}>Mobile Optimized</Text>
              <Text size="sm" ta="center" c="dimmed">
                Designed specifically for mobile devices with touch-friendly interfaces
              </Text>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="sm" align="center">
              <IconOffline size={32} />
              <Text fw={500}>Offline Support</Text>
              <Text size="sm" ta="center" c="dimmed">
                Works offline with cached content and background sync
              </Text>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="sm" align="center">
              <IconBell size={32} />
              <Text fw={500}>Push Notifications</Text>
              <Text size="sm" ta="center" c="dimmed">
                Stay updated with real-time notifications
              </Text>
            </Stack>
          </Card>
        </Stack>

        <Button
          variant="filled"
          size="lg"
          fullWidth
          onClick={handleInstallPWA}
        >
          Install App
        </Button>
      </Stack>
    </Container>
  );
}