import { useState, useEffect } from 'react';
import { Paper, Text, Group, ActionIcon, Box } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { formatTime } from '../../utils/workoutUtils';

interface RestTimerProps {
  startTime: number;
  onReset: () => void;
}

export function RestTimer({ startTime, onReset }: RestTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 100); // Update every 100ms for smooth display

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      <Paper
        p="md"
        radius={0}
        shadow="lg"
        withBorder
        bg="blue.6"
      >
        <Group justify="space-between" align="center">
          <div>
            <Text size="xs" c="white" opacity={0.8} fw={500}>
              Rest Timer
            </Text>
            <Text size="xl" fw={700} c="white" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(elapsedSeconds)}
            </Text>
          </div>
          <ActionIcon
            variant="subtle"
            color="white"
            size="lg"
            onClick={onReset}
          >
            <IconX size={20} />
          </ActionIcon>
        </Group>
      </Paper>
    </Box>
  );
}