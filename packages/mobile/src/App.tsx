import { Navigate, Routes, Route } from 'react-router-dom';
import { AppShell, Stack } from '@mantine/core';
import { AuthGuard } from './components/AuthGuard';
import { BottomNav } from './components/BottomNav';
import { WorkoutPage } from './pages/WorkoutPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { SchedulePage } from './pages/SchedulePage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <AuthGuard>
      <AppShell
        header={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header>
          <Stack justify="center" align="center" h="100%">
            <img src="/CullyLP.png" alt="Cully Strength" style={{ height: '40px', width: 'auto' }} />
          </Stack>
        </AppShell.Header>

        <AppShell.Main style={{ paddingBottom: '70px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/workout" replace />} />
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
