import { NavLink, Stack, Text, Button, Box } from '@mantine/core';
import { IconUsers, IconLogout, IconBuilding, IconActivity, IconBarbell, IconUsersGroup, IconClipboardList, IconCalendar, IconUserCog } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleUsersClick = () => {
    navigate('/users');
  };

  const handleGymsClick = () => {
    navigate('/gyms');
  };

  const handleActivitiesClick = () => {
    navigate('/activities');
  };

  const handleBenchmarksClick = () => {
    navigate('/benchmarks');
  };

  const handleCoachesClick = () => {
    navigate('/coaches');
  };

  const handleClientsClick = () => {
    navigate('/clients');
  };

  const handleProgramsClick = () => {
    navigate('/programs');
  };

  const handleSchedulesClick = () => {
    navigate('/schedules');
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Admin and owner users get full navigation
  const hasFullNavAccess = user?.role === 'admin' || user?.role === 'owner';

  // Client users only see Benchmarks
  const isClient = user?.role === 'client';

  const handleMyBenchmarksClick = () => {
    navigate('/my-benchmarks');
  };

  if (isClient) {
    return (
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation items for clients */}
        <Box style={{ flex: 1 }}>
          <Stack gap="xs" p="md">
            <NavLink
              href="/my-benchmarks"
              label="Benchmarks"
              leftSection={<IconBarbell size={16} />}
              active={location.pathname === '/my-benchmarks'}
              onClick={(event) => {
                event.preventDefault();
                handleMyBenchmarksClick();
              }}
              style={{ borderRadius: '8px' }}
            />
          </Stack>
        </Box>

        {/* Logout button at bottom for client users */}
        <Box p="md">
          <Button
            variant="outline"
            color="red"
            fullWidth
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>
    );
  }

  if (!hasFullNavAccess) {
    return (
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text size="sm" c="dimmed" ta="center">
            No navigation options available
          </Text>
        </Box>

        {/* Logout button at bottom for non-admin users */}
        <Box p="md">
          <Button
            variant="outline"
            color="red"
            fullWidth
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation items */}
      <Box style={{ flex: 1 }}>
        <Stack gap="xs" p="md">
          {/* Admin-only items */}
          {user?.role === 'admin' && (
            <>
              <NavLink
                href="/users"
                label="Users"
                leftSection={<IconUsers size={16} />}
                active={location.pathname === '/users'}
                onClick={(event) => {
                  event.preventDefault();
                  handleUsersClick();
                }}
                style={{ borderRadius: '8px' }}
              />
              <NavLink
                href="/gyms"
                label="Gyms"
                leftSection={<IconBuilding size={16} />}
                active={location.pathname === '/gyms'}
                onClick={(event) => {
                  event.preventDefault();
                  handleGymsClick();
                }}
                style={{ borderRadius: '8px' }}
              />
            </>
          )}

          {/* Admin and Owner items */}
          <NavLink
            href="/activities"
            label="Activities"
            leftSection={<IconActivity size={16} />}
            active={location.pathname === '/activities'}
            onClick={(event) => {
              event.preventDefault();
              handleActivitiesClick();
            }}
            style={{ borderRadius: '8px' }}
          />
          <NavLink
            href="/benchmarks"
            label="Benchmarks"
            leftSection={<IconBarbell size={16} />}
            active={location.pathname === '/benchmarks'}
            onClick={(event) => {
              event.preventDefault();
              handleBenchmarksClick();
            }}
            style={{ borderRadius: '8px' }}
          />
          <NavLink
            href="/coaches"
            label="Coaches"
            leftSection={<IconUserCog size={16} />}
            active={location.pathname === '/coaches'}
            onClick={(event) => {
              event.preventDefault();
              handleCoachesClick();
            }}
            style={{ borderRadius: '8px' }}
          />
          <NavLink
            href="/clients"
            label="Clients"
            leftSection={<IconUsersGroup size={16} />}
            active={location.pathname.startsWith('/clients') && !location.pathname.startsWith('/clients/')}
            onClick={(event) => {
              event.preventDefault();
              handleClientsClick();
            }}
            style={{ borderRadius: '8px' }}
          />
          <NavLink
            href="/programs"
            label="Programs"
            leftSection={<IconClipboardList size={16} />}
            active={location.pathname.startsWith('/programs')}
            onClick={(event) => {
              event.preventDefault();
              handleProgramsClick();
            }}
            style={{ borderRadius: '8px' }}
          />
          <NavLink
            href="/schedules"
            label="Schedules"
            leftSection={<IconCalendar size={16} />}
            active={location.pathname.startsWith('/schedules')}
            onClick={(event) => {
              event.preventDefault();
              handleSchedulesClick();
            }}
            style={{ borderRadius: '8px' }}
          />
        </Stack>
      </Box>

      {/* Logout button always at bottom */}
      <Box p="md">
        <Button
          variant="outline"
          color="red"
          fullWidth
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}