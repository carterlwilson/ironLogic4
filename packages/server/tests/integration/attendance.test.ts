import mongoose from 'mongoose';
import { apiFetch, apiFetchNoAuth, getFixture } from '../support/apiClient';
import { connectDb, disconnectDb, createTestUser, deleteTestUser } from '../support/db';
import { BASE_URL } from '../support/constants';

// ── DB helpers ────────────────────────────────────────────────────────────────

const PASSWORD = 'TestPassword123!';

// All Mondays in the past, matching the schedule's dayOfWeek: 1
const MONDAY_1 = '2026-09-28';
const MONDAY_2 = '2026-10-05';
const MONDAY_3 = '2026-10-12';

async function insertActiveSchedule(opts: {
  gymId: string;
  coachIds: string[];
  assignedClients: string[][];
}): Promise<{ scheduleId: string; timeslotIds: string[] }> {
  const conn = await connectDb();

  const timeSlots = opts.coachIds.map((coachId, i) => ({
    _id: new mongoose.Types.ObjectId(),
    startTime: `${String(8 + i).padStart(2, '0')}:00`,
    endTime: `${String(9 + i).padStart(2, '0')}:00`,
    capacity: 10,
    coachIds: [coachId],
    location: 'Main floor',
    assignedClients: opts.assignedClients[i] ?? [],
  }));

  const result = await conn.collection('activeschedules').insertOne({
    gymId: opts.gymId,
    templateId: new mongoose.Types.ObjectId().toString(),
    days: [{ dayOfWeek: 1, timeSlots }],
    lastResetAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    scheduleId: result.insertedId.toString(),
    timeslotIds: timeSlots.map((s) => s._id.toString()),
  };
}

async function createGymUser(email: string, userType: string, userGymId: string): Promise<string> {
  const id = await createTestUser({ email, userType, password: PASSWORD });
  const conn = await connectDb();
  await conn.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { gymId: userGymId } }
  );
  return id;
}

async function loginUser(email: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await res.json();
  return body.data.accessToken;
}

async function clearAttendance(): Promise<void> {
  const conn = await connectDb();
  await conn.collection('attendancerecords').deleteMany({ gymId: { $in: [gymId, otherGymId] } });
}

// ── Fixture state ─────────────────────────────────────────────────────────────

let gymId: string;
let otherGymId: string;
let clientId: string;        // fixture client, signed up for slot 0
let walkInClientId: string;  // same gym, not signed up
let otherGymClientId: string;
let coachId: string;         // coaches slot 0
let otherCoachId: string;    // coaches slot 1
let ownerId: string;
let coachToken: string;
let otherCoachToken: string;
let ownerToken: string;
let scheduleId: string;
let timeslotIds: string[];

beforeAll(async () => {
  const fixture = getFixture();
  gymId = fixture.gymId;
  clientId = fixture.userId;
  otherGymId = new mongoose.Types.ObjectId().toString();

  walkInClientId = await createGymUser('test-att-walkin@ironlogic4.test', 'client', gymId);
  otherGymClientId = await createGymUser('test-att-othergym@ironlogic4.test', 'client', otherGymId);
  coachId = await createGymUser('test-att-coach@ironlogic4.test', 'coach', gymId);
  otherCoachId = await createGymUser('test-att-coach2@ironlogic4.test', 'coach', gymId);
  ownerId = await createGymUser('test-att-owner@ironlogic4.test', 'owner', gymId);

  coachToken = await loginUser('test-att-coach@ironlogic4.test');
  otherCoachToken = await loginUser('test-att-coach2@ironlogic4.test');
  ownerToken = await loginUser('test-att-owner@ironlogic4.test');

  const result = await insertActiveSchedule({
    gymId,
    coachIds: [coachId, otherCoachId],
    assignedClients: [[clientId], []],
  });
  scheduleId = result.scheduleId;
  timeslotIds = result.timeslotIds;
});

afterAll(async () => {
  await clearAttendance();
  const conn = await connectDb();
  await conn.collection('activeschedules').deleteOne({ _id: new mongoose.Types.ObjectId(scheduleId) });
  for (const id of [walkInClientId, otherGymClientId, coachId, otherCoachId, ownerId]) {
    await deleteTestUser(id);
  }
  await disconnectDb();
});

beforeEach(async () => {
  await clearAttendance();
});

function submit(token: string, body: unknown) {
  return apiFetch('PUT', '/api/gym/attendance/class', body, token);
}

// ── PUT /api/gym/attendance/class ─────────────────────────────────────────────

describe('PUT /api/gym/attendance/class', () => {
  it('returns 401 without auth token', async () => {
    const res = await apiFetchNoAuth('PUT', '/api/gym/attendance/class', {});
    expect(res.status).toBe(401);
  });

  it('rejects clients', async () => {
    const res = await submit(getFixture().accessToken, {
      timeslotId: timeslotIds[0],
      date: MONDAY_1,
      entries: [{ clientId, status: 'present' }],
    });
    expect(res.status).toBe(403);
  });

  it('records attendance with a snapshot of the class', async () => {
    const res = await submit(coachToken, {
      timeslotId: timeslotIds[0],
      date: MONDAY_1,
      entries: [{ clientId, status: 'present' }],
    });
    expect(res.status).toBe(200);
    expect(res.json.data).toHaveLength(1);

    const record = res.json.data[0];
    expect(record).toMatchObject({
      clientId,
      gymId,
      date: MONDAY_1,
      timeslotId: timeslotIds[0],
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:00',
      location: 'Main floor',
      coachIds: [coachId],
      status: 'present',
      walkIn: false,
      recordedBy: coachId,
    });
  });

  it('upserts on resubmission instead of duplicating', async () => {
    const body = { timeslotId: timeslotIds[0], date: MONDAY_1, entries: [{ clientId, status: 'present' }] };
    await submit(coachToken, body);
    const res = await submit(coachToken, { ...body, entries: [{ clientId, status: 'absent' }] });

    expect(res.status).toBe(200);
    expect(res.json.data).toHaveLength(1);
    expect(res.json.data[0].status).toBe('absent');
  });

  it('flags walk-ins and removes clients dropped from a resubmitted roster', async () => {
    const first = await submit(coachToken, {
      timeslotId: timeslotIds[0],
      date: MONDAY_1,
      entries: [
        { clientId, status: 'present' },
        { clientId: walkInClientId, status: 'present' },
      ],
    });
    const walkIn = first.json.data.find((r: any) => r.clientId === walkInClientId);
    expect(walkIn.walkIn).toBe(true);

    const second = await submit(coachToken, {
      timeslotId: timeslotIds[0],
      date: MONDAY_1,
      entries: [{ clientId, status: 'present' }],
    });
    expect(second.json.data.map((r: any) => r.clientId)).toEqual([clientId]);
  });

  it("returns 403 for a coach who doesn't coach the class", async () => {
    const res = await submit(otherCoachToken, {
      timeslotId: timeslotIds[0],
      date: MONDAY_1,
      entries: [{ clientId, status: 'present' }],
    });
    expect(res.status).toBe(403);
  });

  it('lets the gym owner record any class', async () => {
    const res = await submit(ownerToken, {
      timeslotId: timeslotIds[1],
      date: MONDAY_1,
      entries: [{ clientId, status: 'present' }],
    });
    expect(res.status).toBe(200);
  });

  it('rejects a client from another gym', async () => {
    const res = await submit(coachToken, {
      timeslotId: timeslotIds[0],
      date: MONDAY_1,
      entries: [{ clientId: otherGymClientId, status: 'present' }],
    });
    expect(res.status).toBe(400);
  });

  it("rejects a date that isn't on the class's day of the week", async () => {
    const res = await submit(coachToken, {
      timeslotId: timeslotIds[0],
      date: '2026-09-29', // a Tuesday
      entries: [{ clientId, status: 'present' }],
    });
    expect(res.status).toBe(400);
  });

  it('rejects a future date', async () => {
    const res = await submit(coachToken, {
      timeslotId: timeslotIds[0],
      date: '2099-01-05',
      entries: [{ clientId, status: 'present' }],
    });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate clients in one submission', async () => {
    const res = await submit(coachToken, {
      timeslotId: timeslotIds[0],
      date: MONDAY_1,
      entries: [
        { clientId, status: 'present' },
        { clientId, status: 'absent' },
      ],
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown timeslot', async () => {
    const res = await submit(coachToken, {
      timeslotId: new mongoose.Types.ObjectId().toString(),
      date: MONDAY_1,
      entries: [{ clientId, status: 'present' }],
    });
    expect(res.status).toBe(404);
  });
});

// ── GET /api/gym/attendance/class ─────────────────────────────────────────────

describe('GET /api/gym/attendance/class', () => {
  it('returns the records for that class and date only', async () => {
    await submit(coachToken, { timeslotId: timeslotIds[0], date: MONDAY_1, entries: [{ clientId, status: 'present' }] });
    await submit(coachToken, { timeslotId: timeslotIds[0], date: MONDAY_2, entries: [{ clientId, status: 'absent' }] });

    const res = await apiFetch(
      'GET',
      `/api/gym/attendance/class?timeslotId=${timeslotIds[0]}&date=${MONDAY_2}`,
      undefined,
      coachToken
    );
    expect(res.status).toBe(200);
    expect(res.json.data).toHaveLength(1);
    expect(res.json.data[0].status).toBe('absent');
  });
});

// ── Summary and client history ────────────────────────────────────────────────

describe('attendance reporting', () => {
  beforeEach(async () => {
    await submit(coachToken, { timeslotId: timeslotIds[0], date: MONDAY_1, entries: [{ clientId, status: 'present' }] });
    await submit(coachToken, { timeslotId: timeslotIds[0], date: MONDAY_2, entries: [{ clientId, status: 'absent' }] });
    await submit(ownerToken, { timeslotId: timeslotIds[1], date: MONDAY_2, entries: [{ clientId, status: 'present' }] });

    // Simulate the weekly reset wiping signups — history must survive it
    const conn = await connectDb();
    await conn.collection('activeschedules').updateOne(
      { _id: new mongoose.Types.ObjectId(scheduleId) },
      { $set: { 'days.$[].timeSlots.$[].assignedClients': [] } }
    );
    await submit(coachToken, { timeslotId: timeslotIds[0], date: MONDAY_3, entries: [{ clientId, status: 'present' }] });
  });

  afterEach(async () => {
    const conn = await connectDb();
    await conn.collection('activeschedules').updateOne(
      { _id: new mongoose.Types.ObjectId(scheduleId) },
      { $set: { 'days.0.timeSlots.0.assignedClients': [clientId] } }
    );
  });

  it('counts classes per week for every gym client', async () => {
    const res = await apiFetch(
      'GET',
      `/api/gym/attendance/summary?from=${MONDAY_1}&to=${MONDAY_3}&groupBy=week&limit=100`,
      undefined,
      ownerToken
    );
    expect(res.status).toBe(200);
    expect(res.json.data.periods).toEqual(['2026-09-27', '2026-10-04', '2026-10-11']);

    const client = res.json.data.clients.find((c: any) => c.clientId === clientId);
    expect(client.present).toBe(3);
    expect(client.absent).toBe(1);
    expect(client.byPeriod).toEqual([
      { periodStart: '2026-09-27', present: 1, absent: 0 },
      { periodStart: '2026-10-04', present: 1, absent: 1 },
      { periodStart: '2026-10-11', present: 1, absent: 0 },
    ]);

    // Clients with no attendance still appear, with zero counts
    const walkIn = res.json.data.clients.find((c: any) => c.clientId === walkInClientId);
    expect(walkIn.present).toBe(0);

    // Other gyms' clients do not
    expect(res.json.data.clients.map((c: any) => c.clientId)).not.toContain(otherGymClientId);
  });

  it('counts classes per month', async () => {
    const res = await apiFetch(
      'GET',
      `/api/gym/attendance/summary?from=${MONDAY_1}&to=${MONDAY_3}&groupBy=month&search=TEST_Integration`,
      undefined,
      ownerToken
    );
    const client = res.json.data.clients.find((c: any) => c.clientId === clientId);
    expect(client.byPeriod).toEqual([
      { periodStart: '2026-09-01', present: 1, absent: 0 },
      { periodStart: '2026-10-01', present: 2, absent: 1 },
    ]);
  });

  it('paginates clients and reports totals', async () => {
    const base = `/api/gym/attendance/summary?from=${MONDAY_1}&to=${MONDAY_3}&limit=1`;
    const first = await apiFetch('GET', `${base}&page=1`, undefined, ownerToken);
    const second = await apiFetch('GET', `${base}&page=2`, undefined, ownerToken);

    expect(first.status).toBe(200);
    expect(first.json.data.clients).toHaveLength(1);
    expect(first.json.data.pagination.total).toBeGreaterThanOrEqual(2);
    expect(first.json.data.pagination.totalPages).toBe(first.json.data.pagination.total);
    expect(second.json.data.pagination.page).toBe(2);
    expect(second.json.data.clients[0].clientId).not.toBe(first.json.data.clients[0].clientId);
  });

  it('filters clients by search', async () => {
    const res = await apiFetch(
      'GET',
      `/api/gym/attendance/summary?from=${MONDAY_1}&to=${MONDAY_3}&search=test_integration`,
      undefined,
      ownerToken
    );
    expect(res.json.data.clients.map((c: any) => c.clientId)).toEqual([clientId]);
    expect(res.json.data.clients[0].present).toBe(3);
    expect(res.json.data.pagination.total).toBe(1);

    // A full name matches across the first and last name fields
    const fullName = await apiFetch(
      'GET',
      `/api/gym/attendance/summary?from=${MONDAY_1}&to=${MONDAY_3}&search=${encodeURIComponent('Integration Client')}`,
      undefined,
      ownerToken
    );
    expect(fullName.json.data.clients.map((c: any) => c.clientId)).toEqual([clientId]);
  });

  it("returns one client's history, newest first, scoped to the range", async () => {
    const res = await apiFetch(
      'GET',
      `/api/gym/attendance/clients/${clientId}?from=${MONDAY_2}&to=${MONDAY_3}&groupBy=week`,
      undefined,
      ownerToken
    );
    expect(res.status).toBe(200);
    expect(res.json.data.summary.present).toBe(2);
    expect(res.json.data.records.map((r: any) => r.date)).toEqual([MONDAY_3, MONDAY_2, MONDAY_2]);
    expect(res.json.data.records[0].walkIn).toBe(true); // signups were wiped before MONDAY_3
  });

  it("returns 404 for another gym's client", async () => {
    const res = await apiFetch(
      'GET',
      `/api/gym/attendance/clients/${otherGymClientId}?from=${MONDAY_1}&to=${MONDAY_3}`,
      undefined,
      ownerToken
    );
    expect(res.status).toBe(404);
  });

  it('rejects a reversed date range', async () => {
    const res = await apiFetch(
      'GET',
      `/api/gym/attendance/summary?from=${MONDAY_3}&to=${MONDAY_1}`,
      undefined,
      ownerToken
    );
    expect(res.status).toBe(400);
  });
});
