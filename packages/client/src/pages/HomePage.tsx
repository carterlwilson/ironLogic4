import { Container, Title, Text, Button, Stack } from '@mantine/core';
import { useAppTitle } from '../hooks/useAppTitle';

export function HomePage() {
  const appTitle = useAppTitle();

  return (
    <Container size="md">
      <Stack gap="md">
        <Title order={1}>Welcome to {appTitle}</Title>
        <Text size="lg">
          This is the client application built with React, Vite, and Mantine v7.
        </Text>
        <Button variant="filled">Get Started</Button>
      </Stack>
    </Container>
  );
}