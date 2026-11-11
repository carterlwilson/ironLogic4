process.env.TZ = 'UTC';

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isWeeklyResetDue, lastResetBoundary } from '../../src/utils/weeklyReset.js';

const PACIFIC = 'America/Los_Angeles';
const EASTERN = 'America/New_York';

test('the reset boundary is Saturday 23:59 in the gym zone, across DST', () => {
  // Sat Nov 14, 2026 (standard time)
  assert.equal(lastResetBoundary(new Date('2026-11-16T12:00:00Z'), PACIFIC).toISOString(), '2026-11-15T07:59:00.000Z');
  assert.equal(lastResetBoundary(new Date('2026-11-16T12:00:00Z'), EASTERN).toISOString(), '2026-11-15T04:59:00.000Z');
  // Sat Jul 11, 2026 (daylight time)
  assert.equal(lastResetBoundary(new Date('2026-07-13T12:00:00Z'), PACIFIC).toISOString(), '2026-07-12T06:59:00.000Z');
  // Sat Oct 31, 2026, the night before US DST ends
  assert.equal(lastResetBoundary(new Date('2026-11-01T12:00:00Z'), PACIFIC).toISOString(), '2026-11-01T06:59:00.000Z');
  // Half-hour offset zone
  assert.equal(lastResetBoundary(new Date('2026-11-16T12:00:00Z'), 'Asia/Kolkata').toISOString(), '2026-11-14T18:29:00.000Z');
});

test('Saturday before 23:59 local points back to the previous week', () => {
  const satAfternoonPacific = new Date('2026-11-14T22:00:00Z'); // Sat 2pm PST
  assert.equal(lastResetBoundary(satAfternoonPacific, PACIFIC).toISOString(), '2026-11-08T07:59:00.000Z');
});

test('an Eastern gym resets at 23:59 Eastern and a Pacific gym waits until 23:59 Pacific', () => {
  const lastWeek = new Date('2026-11-08T05:00:00Z');
  const easternTick = new Date('2026-11-15T04:59:00Z'); // Sat 11:59pm EST = 8:59pm PST
  assert.equal(isWeeklyResetDue(lastWeek, easternTick, EASTERN), true);
  assert.equal(isWeeklyResetDue(lastWeek, easternTick, PACIFIC), false);

  const pacificTick = new Date('2026-11-15T07:59:00Z'); // Sat 11:59pm PST
  assert.equal(isWeeklyResetDue(lastWeek, pacificTick, PACIFIC), true);
});

test('a gym resets once per week however many ticks fall in the window', () => {
  const tick = new Date('2026-11-15T07:59:00Z');
  const resetAt = new Date('2026-11-15T07:59:00.500Z'); // lastResetAt set by the first tick
  assert.equal(isWeeklyResetDue(resetAt, new Date('2026-11-15T08:14:00Z'), PACIFIC), false);
  assert.equal(isWeeklyResetDue(resetAt, new Date('2026-11-15T08:44:00Z'), PACIFIC), false);
  assert.equal(isWeeklyResetDue(new Date('2026-11-08T08:00:00Z'), tick, PACIFIC), true);
});

test('a missed reset is caught up within the window but not later in the week', () => {
  const lastWeek = new Date('2026-11-08T08:00:00Z');
  assert.equal(isWeeklyResetDue(lastWeek, new Date('2026-11-15T08:44:00Z'), PACIFIC), true); // 45 min late
  assert.equal(isWeeklyResetDue(lastWeek, new Date('2026-11-15T09:14:00Z'), PACIFIC), false); // 75 min late
  assert.equal(isWeeklyResetDue(lastWeek, new Date('2026-11-17T12:00:00Z'), PACIFIC), false); // Tuesday
});

test('a manual reset earlier on Saturday does not skip the weekly reset', () => {
  const manualResetSatNoon = new Date('2026-11-14T20:00:00Z'); // Sat noon PST
  assert.equal(isWeeklyResetDue(manualResetSatNoon, new Date('2026-11-15T07:59:00Z'), PACIFIC), true);
});
