import { Routes, Route } from 'react-router-dom';
import { AppShell, Header, Text } from '@mantine/core';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Text size="xl" fw={500} p="md">
          IronLogic4
        </Text>
      </AppShell.Header>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;