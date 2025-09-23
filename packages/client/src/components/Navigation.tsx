import { NavLink, Stack, Text } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export function Navigation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only admin users get navigation items
  if (user?.role !== 'admin') {
    return (
      <Stack p="md" align="center" justify="center" style={{ minHeight: '200px' }}>
        <Text size="sm" c="dimmed" ta="center">
          No navigation options available
        </Text>
      </Stack>
    );
  }

  const handleUsersClick = () => {
    navigate('/users');
  };

  return (
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
    </Stack>
  );
}