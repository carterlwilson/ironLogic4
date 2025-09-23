import { Routes, Route } from 'react-router-dom';
import { AppShell, Text } from '@mantine/core';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

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
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;