import { Routes, Route } from 'react-router-dom';
import { AppShell, Text, Stack } from '@mantine/core';
import { AuthGuard } from './components/AuthGuard';
import { BottomNav } from './components/BottomNav';
import { MobileHomePage } from './pages/MobileHomePage';
import { WorkoutPage } from './pages/WorkoutPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { SchedulePage } from './pages/SchedulePage';
import { ProfilePage } from './pages/ProfilePage';
import { useAppTitle } from './hooks/useAppTitle';

function App() {
  const appTitle = useAppTitle();

  return (
    <AuthGuard>
      <AppShell
        header={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header>
          <Stack justify="center" h="100%" px="md">
            <Text size="lg" fw={500}>
              {appTitle}
            </Text>
          </Stack>
        </AppShell.Header>

        <AppShell.Main style={{ paddingBottom: '70px' }}>
          <Routes>
            <Route path="/" element={<MobileHomePage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/benchmarks" element={<BenchmarksPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
      <BottomNav />
    </AuthGuard>
  );
}

export default App;