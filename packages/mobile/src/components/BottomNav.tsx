import { UnstyledButton, Group, Text, Stack, rem } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconHome,
  IconBarbell,
  IconChartLine,
  IconCalendar,
  IconUser,
} from '@tabler/icons-react';

interface NavItem {
  label: string;
  path: string;
  icon: typeof IconHome;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    path: '/',
    icon: IconHome,
  },
  {
    label: 'Workout',
    path: '/workout',
    icon: IconBarbell,
  },
  {
    label: 'Benchmarks',
    path: '/benchmarks',
    icon: IconChartLine,
  },
  {
    label: 'Schedule',
    path: '/schedule',
    icon: IconCalendar,
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: IconUser,
  },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Group
      justify="space-around"
      gap={0}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: rem(70),
        borderTop: '1px solid var(--mantine-color-gray-3)',
        backgroundColor: 'var(--mantine-color-body)',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <UnstyledButton
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stack gap={4} align="center">
              <Icon
                size={24}
                stroke={isActive ? 2 : 1.5}
                color={isActive ? 'var(--mantine-color-forestGreen-6)' : 'var(--mantine-color-gray-6)'}
              />
              <Text
                size="xs"
                fw={isActive ? 600 : 400}
                c={isActive ? 'forestGreen' : 'dimmed'}
              >
                {item.label}
              </Text>
            </Stack>
          </UnstyledButton>
        );
      })}
    </Group>
  );
};