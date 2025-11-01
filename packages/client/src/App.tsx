import { Routes, Route } from 'react-router-dom';
import { AppShell, Text } from '@mantine/core';
import { AuthGuard } from './components/AuthGuard';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/UsersPage';
import { GymsPage } from './pages/GymsPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { CoachesPage } from './pages/CoachesPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientBenchmarksPage } from './pages/ClientBenchmarksPage';
import { MyBenchmarksPage } from './pages/MyBenchmarksPage';
import { ProgramListPage } from './pages/Programs/ProgramListPage';
import { ProgramDetailPage } from './pages/Programs/ProgramDetailPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { ScheduleTemplateEditPage } from './pages/ScheduleTemplateEditPage';
import { useAppTitle } from './hooks/useAppTitle';

function App() {
  const appTitle = useAppTitle();

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
            {appTitle}
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
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/benchmarks" element={<BenchmarksPage />} />
            <Route path="/coaches" element={<CoachesPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:clientId/benchmarks" element={<ClientBenchmarksPage />} />
            <Route path="/my-benchmarks" element={<MyBenchmarksPage />} />
            <Route path="/programs" element={<ProgramListPage />} />
            <Route path="/programs/:programId" element={<ProgramDetailPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/schedules/templates/:templateId/edit" element={<ScheduleTemplateEditPage />} />
            {/* All routes are protected by AuthGuard wrapper */}
          </Routes>
        </AppShell.Main>
      </AppShell>
    </AuthGuard>
  );
}

export default App;