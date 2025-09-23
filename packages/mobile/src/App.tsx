import { Routes, Route } from 'react-router-dom';
import { AppShell, Header, Text, Stack } from '@mantine/core';
import { MobileHomePage } from './pages/MobileHomePage';

function App() {
  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Stack justify="center" h="100%" px="md">
          <Text size="lg" fw={500}>
            IronLogic4 Mobile
          </Text>
        </Stack>
      </AppShell.Header>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<MobileHomePage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;