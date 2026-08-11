import mongoose from 'mongoose';
import { apiFetch, apiFetchNoAuth, getFixture } from '../support/apiClient';
import { connectDb, disconnectDb, createTestUser, deleteTestUser } from '../support/db';
import { BASE_URL } from '../support/constants';

// ── DB helpers ────────────────────────────────────────────────────────────────

interface InsertedSchedule {
  scheduleId: string;
  timeslotIds: string[];
}

async function insertActiveSchedule(opts: {
  gymId: string;
  coachId: string;
  capacity?: number;
  numSlots?: number;
}): Promise<InsertedSchedule> {
  const conn = await connectDb();
  const capacity = opts.capacity ?? 2;
  const numSlots = opts.numSlots ?? 2;

  const timeSlots = Array.from({ length: numSlots }, (_, i) => ({
    _id: new mongoose.Types.ObjectId(),
    startTime: `${String(8 + i).padStart(2, '0')}:00`,
    endTime: `${String(9 + i).padStart(2, '0')}:00`,
    capacity,
    assignedClients: [],
  }));

  const result = await conn.collection('activeschedules').insertOne({
    gymId: opts.gymId,
    templateId: new mongoose.Types.ObjectId().toString(), // unique per insert
    coachIds: [opts.coachId],
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

async function deleteSchedule(scheduleId: string): Promise<void> {
  const conn = await connectDb();
  await conn
    .collection('activeschedules')
    .deleteOne({ _id: new mongoose.Types.ObjectId(scheduleId) });
}

async function clearAssignments(scheduleId: string): Promise<void> {
  const conn = await connectDb();
  await conn.collection('activeschedules').updateOne(
    { _id: new mongoose.Types.ObjectId(scheduleId) },
    { $set: { 'days.$[].timeSlots.$[].assignedClients': [] } }
  );
}

async function fillSlot(scheduleId: string, timeslotId: string, clientId: string): Promise<void> {
  const conn = await connectDb();
  await conn.collection('activeschedules').updateOne(
    { _id: new mongoose.Types.ObjectId(scheduleId) },
    { $addToSet: { 'days.$[].timeSlots.$[slot].assignedClients': clientId } },
    { arrayFilters: [{ 'slot._id': new mongoose.Types.ObjectId(timeslotId) }] }
  );
}

async function loginUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.data.accessToken;
}

// ── Fixture state shared across all describe blocks ───────────────────────────

let gymId: string;
let userId: string;
let accessToken: string;
let coachId: string;
let scheduleId: string;
let timeslotIds: string[];

beforeAll(async () => {
  const fixture = getFixture();
  gymId = fixture.gymId;
  userId = fixture.userId;
  accessToken = fixture.accessToken;

  coachId = await createTestUser({
    email: 'test-sched-coach@ironlogic4.test',
    userType: 'coach',
    password: 'TestPassword123!',
  });

  const result = await insertActiveSchedule({ gymId, coachId, capacity: 2, numSlots: 2 });
  scheduleId = result.scheduleId;
  timeslotIds = result.timeslotIds;
});

afterAll(async () => {
  await deleteSchedule(scheduleId);
  await deleteTestUser(coachId);
  await disconnectDb();
});

beforeEach(async () => {
  // Start each test with a clean slate — no one is signed up for anything.
  await clearAssignments(scheduleId);
});

// ── GET /api/gym/schedules/available ─────────────────────────────────────────

describe('GET /api/gym/schedules/available', () => {
  it('returns 401 without auth token', async () => {
    const res = await apiFetchNoAuth('GET', '/api/gym/schedules/available');
    expect(res.status).toBe(401);
  });

  it('returns schedules with computed availableSpots and isUserAssigned fields', async () => {
    const res = await apiFetch('GET', '/api/gym/schedules/available');
    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);

    const schedule = res.json.data.find((s: any) => s.id === scheduleId);
    expect(schedule).toBeDefined();

    const slot = schedule.days[0].timeSlots[0];
    expect(slot.availableSpots).toBe(2);
    expect(slot.isUserAssigned).toBe(false);
  });

  it('sets isUserAssigned=true and decrements availableSpots after joining', async () => {
    const [timeslotId] = timeslotIds;
    await apiFetch('POST', `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`);

    const res = await apiFetch('GET', '/api/gym/schedules/available');
    const schedule = res.json.data.find((s: any) => s.id === scheduleId);
    const slot = schedule.days[0].timeSlots.find((s: any) => s.id === timeslotId);

    expect(slot.isUserAssigned).toBe(true);
    expect(slot.availableSpots).toBe(1);
  });

  it("only returns schedules belonging to the user's gym", async () => {
    const otherGymId = new mongoose.Types.ObjectId().toString();
    const other = await insertActiveSchedule({ gymId: otherGymId, coachId, capacity: 2 });

    try {
      const res = await apiFetch('GET', '/api/gym/schedules/available');
      const returnedIds = res.json.data.map((s: any) => s.id);
      expect(returnedIds).not.toContain(other.scheduleId);
    } finally {
      await deleteSchedule(other.scheduleId);
    }
  });

  it('includes coach details alongside coachIds', async () => {
    const res = await apiFetch('GET', '/api/gym/schedules/available');
    const schedule = res.json.data.find((s: any) => s.id === scheduleId);
    expect(Array.isArray(schedule.coaches)).toBe(true);
  });
});

// ── GET /api/gym/schedules/my-schedule ───────────────────────────────────────

describe('GET /api/gym/schedules/my-schedule', () => {
  it('returns 401 without auth token', async () => {
    const res = await apiFetchNoAuth('GET', '/api/gym/schedules/my-schedule');
    expect(res.status).toBe(401);
  });

  it('returns empty array when not assigned to any timeslots', async () => {
    const res = await apiFetch('GET', '/api/gym/schedules/my-schedule');
    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
    expect(res.json.data).toEqual([]);
  });

  it('returns only the timeslots the user is assigned to', async () => {
    const [joinedSlotId, otherSlotId] = timeslotIds;
    await apiFetch('POST', `/api/gym/schedules/active/${scheduleId}/timeslots/${joinedSlotId}/join`);

    const res = await apiFetch('GET', '/api/gym/schedules/my-schedule');
    expect(res.status).toBe(200);

    const entry = res.json.data.find((s: any) => s.scheduleId === scheduleId);
    expect(entry).toBeDefined();

    const returnedSlotIds = entry.days.flatMap((d: any) =>
      d.timeSlots.map((s: any) => s.id ?? s._id?.toString())
    );
    expect(returnedSlotIds).toContain(joinedSlotId);
    expect(returnedSlotIds).not.toContain(otherSlotId);
  });
});

// ── POST .../join ─────────────────────────────────────────────────────────────

describe('POST /api/gym/schedules/active/:id/timeslots/:timeslotId/join', () => {
  it('returns 401 without auth token', async () => {
    const [timeslotId] = timeslotIds;
    const res = await apiFetchNoAuth(
      'POST',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`
    );
    expect(res.status).toBe(401);
  });

  it('joins a timeslot successfully', async () => {
    const [timeslotId] = timeslotIds;
    const res = await apiFetch(
      'POST',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`
    );
    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
  });

  it('returns 400 if already assigned to the same timeslot', async () => {
    const [timeslotId] = timeslotIds;
    await apiFetch('POST', `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`);

    const res = await apiFetch(
      'POST',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`
    );
    expect(res.status).toBe(400);
    expect(res.json.error).toMatch(/already assigned/i);
  });

  it('returns 404 if the schedule does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const [timeslotId] = timeslotIds;
    const res = await apiFetch(
      'POST',
      `/api/gym/schedules/active/${fakeId}/timeslots/${timeslotId}/join`
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 if the timeslot does not exist in the schedule', async () => {
    const fakeSlotId = new mongoose.Types.ObjectId().toString();
    const res = await apiFetch(
      'POST',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${fakeSlotId}/join`
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 if the schedule belongs to a different gym', async () => {
    const otherGymId = new mongoose.Types.ObjectId().toString();
    const other = await insertActiveSchedule({ gymId: otherGymId, coachId, capacity: 2 });

    try {
      const res = await apiFetch(
        'POST',
        `/api/gym/schedules/active/${other.scheduleId}/timeslots/${other.timeslotIds[0]}/join`
      );
      expect(res.status).toBe(403);
    } finally {
      await deleteSchedule(other.scheduleId);
    }
  });

  it('returns 400 if the user has no gymId assigned', async () => {
    // createTestUser does not set gymId, so this user has none
    const noGymUserId = await createTestUser({
      email: 'test-sched-nogym@ironlogic4.test',
      userType: 'client',
      password: 'TestPassword123!',
    });
    const noGymToken = await loginUser('test-sched-nogym@ironlogic4.test', 'TestPassword123!');

    try {
      const [timeslotId] = timeslotIds;
      const res = await apiFetch(
        'POST',
        `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`,
        undefined,
        noGymToken
      );
      expect(res.status).toBe(400);
    } finally {
      await deleteTestUser(noGymUserId);
    }
  });

  it('returns 400 when the timeslot is at full capacity', async () => {
    const cap1 = await insertActiveSchedule({ gymId, coachId, capacity: 1, numSlots: 1 });
    const [capSlotId] = cap1.timeslotIds;

    // Fill the only spot directly in the DB with a fake client
    await fillSlot(cap1.scheduleId, capSlotId, 'some-other-client-id');

    try {
      const res = await apiFetch(
        'POST',
        `/api/gym/schedules/active/${cap1.scheduleId}/timeslots/${capSlotId}/join`
      );
      expect(res.status).toBe(400);
      expect(res.json.error).toMatch(/capacity/i);
    } finally {
      await deleteSchedule(cap1.scheduleId);
    }
  });
});

// ── DELETE .../leave ──────────────────────────────────────────────────────────

describe('DELETE /api/gym/schedules/active/:id/timeslots/:timeslotId/leave', () => {
  it('returns 401 without auth token', async () => {
    const [timeslotId] = timeslotIds;
    const res = await apiFetchNoAuth(
      'DELETE',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/leave`
    );
    expect(res.status).toBe(401);
  });

  it('leaves a timeslot successfully after joining', async () => {
    const [timeslotId] = timeslotIds;
    await apiFetch('POST', `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`);

    const res = await apiFetch(
      'DELETE',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/leave`
    );
    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
  });

  it('restores availableSpots and clears isUserAssigned after leaving', async () => {
    const [timeslotId] = timeslotIds;
    await apiFetch('POST', `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`);
    await apiFetch(
      'DELETE',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/leave`
    );

    const res = await apiFetch('GET', '/api/gym/schedules/available');
    const schedule = res.json.data.find((s: any) => s.id === scheduleId);
    const slot = schedule.days[0].timeSlots.find((s: any) => s.id === timeslotId);

    expect(slot.isUserAssigned).toBe(false);
    expect(slot.availableSpots).toBe(2);
  });

  it('removes the timeslot from my-schedule after leaving', async () => {
    const [timeslotId] = timeslotIds;
    await apiFetch('POST', `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`);
    await apiFetch(
      'DELETE',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/leave`
    );

    const res = await apiFetch('GET', '/api/gym/schedules/my-schedule');
    expect(res.json.data).toEqual([]);
  });

  it('returns 400 if not assigned to the timeslot', async () => {
    const [timeslotId] = timeslotIds;
    const res = await apiFetch(
      'DELETE',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/leave`
    );
    expect(res.status).toBe(400);
    expect(res.json.error).toMatch(/not assigned/i);
  });

  it('returns 404 if the schedule does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const [timeslotId] = timeslotIds;
    const res = await apiFetch(
      'DELETE',
      `/api/gym/schedules/active/${fakeId}/timeslots/${timeslotId}/leave`
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 if the timeslot does not exist in the schedule', async () => {
    const fakeSlotId = new mongoose.Types.ObjectId().toString();
    const res = await apiFetch(
      'DELETE',
      `/api/gym/schedules/active/${scheduleId}/timeslots/${fakeSlotId}/leave`
    );
    expect(res.status).toBe(404);
  });
});

// ── Race condition: concurrent joins for the last open spot ───────────────────

describe('concurrent join race condition', () => {
  it('allows only one of two simultaneous joins when one spot remains', async () => {
    // capacity=2 schedule, pre-fill one spot so exactly 1 remains
    const race = await insertActiveSchedule({ gymId, coachId, capacity: 2, numSlots: 1 });
    const [raceSlotId] = race.timeslotIds;
    await fillSlot(race.scheduleId, raceSlotId, 'pre-existing-client-id');

    // A second client in the same gym competes for the last spot
    const secondUserId = await createTestUser({
      email: 'test-sched-race@ironlogic4.test',
      userType: 'client',
      password: 'TestPassword123!',
    });
    const conn = await connectDb();
    await conn
      .collection('users')
      .updateOne({ _id: new mongoose.Types.ObjectId(secondUserId) }, { $set: { gymId } });
    const secondToken = await loginUser('test-sched-race@ironlogic4.test', 'TestPassword123!');

    try {
      const joinUrl = `/api/gym/schedules/active/${race.scheduleId}/timeslots/${raceSlotId}/join`;
      const [res1, res2] = await Promise.all([
        apiFetch('POST', joinUrl, undefined, accessToken),
        apiFetch('POST', joinUrl, undefined, secondToken),
      ]);

      const statuses = [res1.status, res2.status];
      // Exactly one succeeds, the other is rejected
      expect(statuses.filter((s) => s === 200)).toHaveLength(1);
      expect(statuses.filter((s) => s === 400)).toHaveLength(1);
    } finally {
      await deleteSchedule(race.scheduleId);
      await deleteTestUser(secondUserId);
    }
  });
});