import { renderToStaticMarkup } from 'react-dom/server';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';
import { AttendanceRoster } from './AttendanceRoster';
import type { DirectoryClient } from '../../hooks/useClientDirectory';
import type { FlatCoachTimeslot } from '../../utils/coachScheduleUtils';

describe('AttendanceRoster', () => {
  it('resolves names after the directory loads even when the selected slot has no names', () => {
    const slot: FlatCoachTimeslot = {
      timeslotId: 'slot-1',
      scheduleId: 'schedule-1',
      dayOfWeek: 1,
      startTime: '17:00',
      endTime: '18:00',
      capacity: 10,
      location: 'CS2',
      assignedClients: [{ id: 'client-1' }],
    };
    const render = (clients: DirectoryClient[]) => renderToStaticMarkup(
      <MantineProvider>
        <AttendanceRoster
          slot={slot}
          date="2026-11-16"
          clients={clients}
          clientMap={new Map(clients.map((client) => [client.id, client]))}
          clientsLoading={clients.length === 0}
          onBack={() => {}}
        />
      </MantineProvider>
    );

    expect(render([])).toContain('Unknown client');
    const loaded = render([
      { id: 'client-1', firstName: 'Test', lastName: 'Member', email: 'member@example.com' },
    ]);
    expect(loaded).toContain('Test Member');
    expect(loaded).not.toContain('Unknown client');
  });
});
