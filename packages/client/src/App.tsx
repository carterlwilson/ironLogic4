import { Routes, Route } from 'react-router-dom';
import { AppShell, Text } from '@mantine/core';
import { AuthGuard } from './components/AuthGuard';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <AuthGuard>
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* All routes are protected by AuthGuard wrapper */}
          </Routes>
        </AppShell.Main>
      </AppShell>
    </AuthGuard>
  );
}

export default App;