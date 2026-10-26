import { useEffect, useState } from 'react';
import { Stack, Group, SegmentedControl, Select, Text, Loader, Center, Paper, Box } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconMapPin } from '@tabler/icons-react';
import type { IScheduleDay, ApiResponse } from '@ironlogic4/shared';
import { scheduleApi } from '../../../services/scheduleApi';
import type { Coach } from '../../../hooks/useCoaches';
import type { Client } from '../../../hooks/useClients';
import { getDayName } from '../../../utils/scheduleUtils';
import { GridSlot } from './GridSlot';

type GridSource = 'template' | 'active';

interface GridSchedule {
  id: string;
  days: IScheduleDay[];
}

interface ScheduleGridViewProps {
  coaches: Coach[];
  clients: Client[];
  clientsLoading: boolean;
}

const ALL_LOCATIONS = '__all__';

const MIN_DAY_WIDTH = 240;
const DAY_GAP = 10; // matches --mantine-spacing-xs

// Monday-first ordering, matching the gym's sign-up sheet
const dayOrder = (dayOfWeek: number) => (dayOfWeek + 6) % 7;

/**
 * Spreadsheet-style overview of the whole week: days across, class times down,
 * with every spot listed so open availability is visible at a glance.
 * Can show either the recurring roster (template) or this week's active schedule.
 *
 * Fetches its own copies of both schedules on mount so it always reflects the
 * latest saved data (including autosaves from the template editor tab).
 */
export function ScheduleGridView({ coaches, clients, clientsLoading }: ScheduleGridViewProps) {
  const [source, setSource] = useState<GridSource>('template');
  const [location, setLocation] = useState<string>(ALL_LOCATIONS);
  const [template, setTemplate] = useState<GridSchedule | null>(null);
  const [active, setActive] = useState<GridSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  // Available width, used to decide how many days fit side by side
  const { ref: containerRef, width } = useElementSize();

  useEffect(() => {
    const load = async () => {
      try {
        const [templateResponse, activeResponse] = await Promise.all([
          scheduleApi.getTemplates(),
          scheduleApi.getActiveSchedule(),
        ]);
        setTemplate(templateResponse.data?.[0] ?? null);
        setActive(activeResponse.data ?? null);
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to load schedule',
          color: 'red',
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const schedule = source === 'template' ? template : active;

  const handleMutation = async (request: () => Promise<ApiResponse<GridSchedule>>) => {
    try {
      const response = await request();
      if (!response.data) return;
      const updated = { id: response.data.id, days: response.data.days };
      if (source === 'template') {
        setTemplate(updated);
      } else {
        setActive(updated);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update timeslot',
        color: 'red',
        autoClose: 5000,
      });
    }
  };

  const handleAdd = (timeslotId: string, clientId: string) => {
    if (!schedule) return Promise.resolve();
    return handleMutation(() =>
      source === 'template'
        ? scheduleApi.addTemplateTimeslotClient(schedule.id, timeslotId, clientId)
        : scheduleApi.addActiveTimeslotClient(schedule.id, timeslotId, clientId)
    );
  };

  const handleRemove = (timeslotId: string, clientId: string) => {
    if (!schedule) return Promise.resolve();
    return handleMutation(() =>
      source === 'template'
        ? scheduleApi.removeTemplateTimeslotClient(schedule.id, timeslotId, clientId)
        : scheduleApi.removeActiveTimeslotClient(schedule.id, timeslotId, clientId)
    );
  };

  const days = [...(schedule?.days ?? [])]
    .filter((day) => day.timeSlots.length > 0)
    .sort((a, b) => dayOrder(a.dayOfWeek) - dayOrder(b.dayOfWeek));

  const locations = [
    ...new Set(days.flatMap((day) => day.timeSlots.map((ts) => ts.location.trim()).filter(Boolean))),
  ].sort();

  const matchesLocation = (slotLocation: string) =>
    location === ALL_LOCATIONS || slotLocation.trim() === location;

  const startTimes = [
    ...new Set(
      days.flatMap((day) => day.timeSlots.filter((ts) => matchesLocation(ts.location)).map((ts) => ts.startTime))
    ),
  ].sort();

  // Wrap days onto multiple rows when they don't fit side by side, balancing the
  // rows (e.g. 6 days at max 4 across -> 3 + 3). Each row keeps its own time
  // alignment so classes at the same time still line up across days.
  const maxPerRow = width > 0
    ? Math.max(1, Math.floor((width + DAY_GAP) / (MIN_DAY_WIDTH + DAY_GAP)))
    : days.length;
  const daysPerRow = Math.max(1, Math.ceil(days.length / Math.ceil(days.length / maxPerRow)));
  const dayRows: IScheduleDay[][] = [];
  for (let i = 0; i < days.length; i += daysPerRow) {
    dayRows.push(days.slice(i, i + daysPerRow));
  }

  const openSpotsForDay = (day: IScheduleDay) =>
    day.timeSlots
      .filter((ts) => matchesLocation(ts.location))
      .reduce((sum, ts) => sum + Math.max(0, ts.capacity - ts.assignedClients.length), 0);

  if (loading) {
    return (
      <Center ref={containerRef} py="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack ref={containerRef} gap="md">
      <Group justify="space-between" wrap="wrap">
        <SegmentedControl
          value={source}
          onChange={(value) => {
            setSource(value as GridSource);
            setLocation(ALL_LOCATIONS);
          }}
          data={[
            { value: 'template', label: 'Recurring roster' },
            { value: 'active', label: 'This week' },
          ]}
        />
        {locations.length > 1 && (
          <Select
            w={220}
            leftSection={<IconMapPin size={16} />}
            value={location}
            onChange={(value) => setLocation(value ?? ALL_LOCATIONS)}
            data={[{ value: ALL_LOCATIONS, label: 'All locations' }, ...locations]}
            allowDeselect={false}
          />
        )}
      </Group>

      <Text size="sm" c="dimmed">
        {source === 'template'
          ? 'Changes to the recurring roster carry into the active schedule the next time it is reset.'
          : "Changes here only affect this week's active schedule and are replaced at the next reset."}
      </Text>

      {!schedule || days.length === 0 ? (
        <Paper withBorder p="xl">
          <Text ta="center" c="dimmed">
            {source === 'template'
              ? 'No schedule template yet. Create one in the Schedule Template tab.'
              : 'No active schedule yet. Create one in the Active Schedule tab.'}
          </Text>
        </Paper>
      ) : (
        <Stack gap="lg">
          {dayRows.map((rowDays) => (
            <Box
              key={rowDays.map((day) => day.dayOfWeek).join('-')}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${daysPerRow}, minmax(0, 1fr))`,
                gap: DAY_GAP,
                alignItems: 'start',
              }}
            >
              {rowDays.map((day) => (
                <Paper key={day.dayOfWeek} withBorder p={6} bg="var(--mantine-color-default-hover)">
                  <Text fw={700} ta="center">
                    {getDayName(day.dayOfWeek)}
                  </Text>
                  <Text size="xs" c="dimmed" ta="center">
                    {openSpotsForDay(day)} open spots
                  </Text>
                </Paper>
              ))}

              {startTimes
                .filter((startTime) =>
                  rowDays.some((day) =>
                    day.timeSlots.some((ts) => ts.startTime === startTime && matchesLocation(ts.location))
                  )
                )
                .flatMap((startTime) =>
                  rowDays.map((day) => (
                    <Stack key={`${startTime}-${day.dayOfWeek}`} gap="xs">
                      {day.timeSlots
                        .filter((ts) => ts.startTime === startTime && matchesLocation(ts.location))
                        .map((ts) => (
                          <GridSlot
                            key={ts.id}
                            timeslot={ts}
                            coaches={coaches}
                            clients={clients}
                            clientsLoading={clientsLoading}
                            onAdd={(clientId) => handleAdd(ts.id, clientId)}
                            onRemove={(clientId) => handleRemove(ts.id, clientId)}
                          />
                        ))}
                    </Stack>
                  ))
                )}
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
