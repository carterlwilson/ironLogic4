import { Container, Title, Text, Button, Stack } from '@mantine/core';

export function HomePage() {
  return (
    <Container size="md">
      <Stack gap="md">
        <Title order={1}>Welcome to IronLogic4</Title>
        <Text size="lg">
          This is the client application built with React, Vite, and Mantine v7.
        </Text>
        <Button variant="filled">Get Started</Button>
      </Stack>
    </Container>
  );
}