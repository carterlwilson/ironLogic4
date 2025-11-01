import { Card, Text, Avatar, Stack, Badge, Group } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';

interface CoachCardProps {
  id: string;
  name: string;
  availableSpots: number;
  totalSpots: number;
  userBookings: number;
  onSelect: (coachId: string) => void;
}

export function CoachCard({
  id,
  name,
  availableSpots,
  totalSpots,
  userBookings,
  onSelect,
}: CoachCardProps) {
  const percentAvailable = totalSpots > 0 ? (availableSpots / totalSpots) * 100 : 0;

  const getBadgeColor = () => {
    if (availableSpots === 0) return 'red';
    if (percentAvailable < 25) return 'orange';
    if (percentAvailable < 50) return 'yellow';
    return 'green';
  };

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{ cursor: 'pointer', minHeight: 140 }}
      onClick={() => onSelect(id)}
    >
      <Stack gap="sm" align="center">
        {/* Avatar */}
        <Avatar size="lg" radius="xl" color="forestGreen">
          <IconUser size={24} />
        </Avatar>

        {/* Coach Name */}
        <Text fw={600} size="sm" ta="center" lineClamp={1}>
          {name}
        </Text>

        {/* Available Spots Badge */}
        <Badge color={getBadgeColor()} variant="light" size="md" fullWidth>
          {availableSpots} / {totalSpots} spots
        </Badge>

        {/* User Bookings */}
        {userBookings > 0 && (
          <Group gap={4} justify="center">
            <Text size="xs" c="forestGreen" fw={600}>
              {userBookings} booked
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}