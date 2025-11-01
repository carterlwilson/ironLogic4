import { SimpleGrid, Stack, Text, Skeleton } from '@mantine/core';
import { CoachCard } from './CoachCard';

interface CoachData {
  id: string;
  name: string;
  totalSpots: number;
  availableSpots: number;
  userBookings: number;
}

interface CoachSelectorProps {
  coaches: CoachData[];
  loading: boolean;
  onSelectCoach: (coachId: string) => void;
}

export function CoachSelector({ coaches, loading, onSelectCoach }: CoachSelectorProps) {
  if (loading) {
    return (
      <SimpleGrid cols={2} spacing="md">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={140} radius="md" />
        ))}
      </SimpleGrid>
    );
  }

  if (coaches.length === 0) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed" size="sm">
          No coaches available at this time.
        </Text>
      </Stack>
    );
  }

  return (
    <SimpleGrid cols={2} spacing="md">
      {coaches.map((coach) => (
        <CoachCard
          key={coach.id}
          id={coach.id}
          name={coach.name}
          availableSpots={coach.availableSpots}
          totalSpots={coach.totalSpots}
          userBookings={coach.userBookings}
          onSelect={onSelectCoach}
        />
      ))}
    </SimpleGrid>
  );
}