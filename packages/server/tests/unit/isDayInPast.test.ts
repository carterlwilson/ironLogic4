// Prod runs in UTC (Render). Pin the process zone so these tests behave the same on any machine.
process.env.TZ = 'UTC';

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DayOfWeek, GYM_TIME_ZONE, isDayInPast } from '@ironlogic4/shared';

// Saturday 11:59pm Eastern reset before the week of Sun Nov 8, 2026 (after the Nov 1 DST change).
const lastResetAt = new Date('2026-11-08T04:59:00.224Z');

test('a Monday evening class is not past at 4:30pm Pacific on Monday', () => {
  // Mon Nov 9, 4:30pm PST is already Tuesday in UTC.
  const now = new Date('2026-11-10T00:30:00Z');
  assert.equal(isDayInPast(DayOfWeek.MONDAY, lastResetAt, now, GYM_TIME_ZONE), false);
});

test('a Monday class is past on Tuesday morning Pacific', () => {
  const now = new Date('2026-11-10T16:00:00Z'); // Tue Nov 10, 8am PST
  assert.equal(isDayInPast(DayOfWeek.MONDAY, lastResetAt, now, GYM_TIME_ZONE), true);
});

test('no day is past on the evening of a Saturday reset', () => {
  const reset = new Date('2026-11-15T04:59:00Z'); // Sat Nov 14, 8:59pm PST
  const now = new Date('2026-11-15T05:30:00Z'); // Sat Nov 14, 9:30pm PST
  assert.equal(isDayInPast(DayOfWeek.SUNDAY, reset, now, GYM_TIME_ZONE), false);
});
