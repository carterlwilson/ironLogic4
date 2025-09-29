import { Routes, Route } from 'react-router-dom';
import { AppShell, Text } from '@mantine/core';
import { AuthGuard } from './components/AuthGuard';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/UsersPage';
import { GymsPage } from './pages/GymsPage';

function App() {
  return (
    <AuthGuard>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 280,
          breakpoint: 'sm',
        }}
        padding="md"
      >
        <AppShell.Header>
          <Text size="xl" fw={500} p="md">
            IronLogic4
          </Text>
        </AppShell.Header>

        <AppShell.Navbar p="md" style={{ backgroundColor: '#fafafa' }}>
          <Navigation />
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/gyms" element={<GymsPage />} />
            {/* All routes are protected by AuthGuard wrapper */}
          </Routes>
        </AppShell.Main>
      </AppShell>
    </AuthGuard>
  );
}

export default App;