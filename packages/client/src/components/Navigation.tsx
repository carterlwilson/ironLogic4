import { NavLink, Stack, Text, Button, Box } from '@mantine/core';
import { IconUsers, IconLogout, IconBuilding } from '@tabler/icons-react';
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

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Only admin users get navigation items
  if (user?.role !== 'admin') {
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