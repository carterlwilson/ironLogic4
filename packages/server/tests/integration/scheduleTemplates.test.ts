import mongoose from 'mongoose';
import { apiFetch } from '../support/apiClient';
import { connectDb, disconnectDb, createTestUser, deleteTestUser } from '../support/db';
import { BASE_URL } from '../support/constants';

const PASSWORD = 'TestPassword123!';

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

// Own gym so the one-template-per-gym index can't collide with other suites
const gymId = new mongoose.Types.ObjectId().toString();
const otherGymId = new mongoose.Types.ObjectId().toString();
let ownerId: string;
let clientId: string;
let otherGymClientId: string;
let coachId: string;
let newCoachId: string;
let substituteCoachId: string;
let ownerToken: string;
let templateId: string;
let activeScheduleId: string;

beforeAll(async () => {
  ownerId = await createGymUser('test-tmpl-owner@ironlogic4.test', 'owner', gymId);
  clientId = await createGymUser('test-tmpl-client@ironlogic4.test', 'client', gymId);
  otherGymClientId = await createGymUser('test-tmpl-othergym@ironlogic4.test', 'client', otherGymId);
  coachId = await createGymUser('test-tmpl-coach@ironlogic4.test', 'coach', gymId);
  newCoachId = await createGymUser('test-tmpl-coach2@ironlogic4.test', 'coach', gymId);
  substituteCoachId = await createGymUser('test-tmpl-coach3@ironlogic4.test', 'coach', gymId);
  ownerToken = await loginUser('test-tmpl-owner@ironlogic4.test');

  const conn = await connectDb();
  const result = await conn.collection('scheduletemplates').insertOne({
    gymId,
    name: 'TEST_Template',
    createdBy: ownerId,
    days: [{ dayOfWeek: 1, timeSlots: [] }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  templateId = result.insertedId.toString();

  const active = await conn.collection('activeschedules').insertOne({
    gymId,
    templateId,
    days: [{ dayOfWeek: 1, timeSlots: [] }],
    lastResetAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  activeScheduleId = active.insertedId.toString();
});

afterAll(async () => {
  const conn = await connectDb();
  await conn.collection('scheduletemplates').deleteOne({ _id: new mongoose.Types.ObjectId(templateId) });
  await conn.collection('activeschedules').deleteOne({ _id: new mongoose.Types.ObjectId(activeScheduleId) });
  for (const id of [ownerId, clientId, otherGymClientId, coachId, newCoachId, substituteCoachId]) {
    await deleteTestUser(id);
  }
  await disconnectDb();
});

describe('PUT /api/gym/schedules/templates/:id', () => {
  it("drops assigned clients that aren't current clients of the gym", async () => {
    const deletedClientId = new mongoose.Types.ObjectId().toString();

    const res = await apiFetch('PUT', `/api/gym/schedules/templates/${templateId}`, {
      days: [{
        dayOfWeek: 1,
        timeSlots: [{
          id: new mongoose.Types.ObjectId().toString(),
          startTime: '08:00',
          endTime: '09:00',
          capacity: 10,
          coachIds: [ownerId],
          location: 'Main floor',
          assignedClients: [clientId, deletedClientId, otherGymClientId, ownerId, 'not-an-id'],
        }],
      }],
    }, ownerToken);

    expect(res.status).toBe(200);
    expect(res.json.data.days[0].timeSlots[0].assignedClients).toEqual([clientId]);
  });
});

describe('PUT /api/gym/schedules/templates/:id coach changes', () => {
  function slot(startTime: string, coach: string) {
    return {
      id: new mongoose.Types.ObjectId().toString(),
      startTime,
      endTime: `${String(Number(startTime.slice(0, 2)) + 1).padStart(2, '0')}:00`,
      capacity: 10,
      coachIds: [coach],
      location: 'Main floor',
      assignedClients: [],
    };
  }

  function saveTemplate(timeSlots: ReturnType<typeof slot>[]) {
    return apiFetch('PUT', `/api/gym/schedules/templates/${templateId}`, {
      days: [{ dayOfWeek: 1, timeSlots }],
    }, ownerToken);
  }

  async function activeSlots(): Promise<any[]> {
    const conn = await connectDb();
    const schedule = await conn.collection('activeschedules').findOne({ _id: new mongoose.Types.ObjectId(activeScheduleId) });
    return schedule!.days[0].timeSlots;
  }

  async function setActiveCoach(startTime: string, coach: string): Promise<void> {
    const conn = await connectDb();
    await conn.collection('activeschedules').updateOne(
      { _id: new mongoose.Types.ObjectId(activeScheduleId) },
      { $set: { 'days.0.timeSlots.$[slot].coachIds': [coach] } },
      { arrayFilters: [{ 'slot.startTime': startTime }] }
    );
  }

  beforeEach(async () => {
    const res = await saveTemplate([slot('08:00', coachId), slot('09:00', coachId)]);
    expect(res.status).toBe(200);

    const conn = await connectDb();
    await conn.collection('activeschedules').updateOne(
      { _id: new mongoose.Types.ObjectId(activeScheduleId) },
      {
        $set: {
          days: [{
            dayOfWeek: 1,
            timeSlots: ['08:00', '09:00'].map((startTime) => ({
              ...slot(startTime, coachId),
              _id: new mongoose.Types.ObjectId(),
              assignedClients: [clientId],
            })),
          }],
        },
      }
    );
  });

  it('applies a coach swap to the matching active class only', async () => {
    const res = await saveTemplate([slot('08:00', newCoachId), slot('09:00', coachId)]);
    expect(res.status).toBe(200);

    const [changed, unchanged] = await activeSlots();
    expect(changed.coachIds).toEqual([newCoachId]);
    expect(changed.assignedClients).toEqual([clientId]);
    expect(unchanged.coachIds).toEqual([coachId]);
  });

  it('keeps a substitute set on the active schedule when that class is unchanged', async () => {
    await setActiveCoach('09:00', substituteCoachId);

    await saveTemplate([slot('08:00', newCoachId), slot('09:00', coachId)]);

    const [, substituted] = await activeSlots();
    expect(substituted.coachIds).toEqual([substituteCoachId]);
  });

  it('replaces a substitute when the template changes that class', async () => {
    await setActiveCoach('09:00', substituteCoachId);

    await saveTemplate([slot('08:00', coachId), slot('09:00', newCoachId)]);

    const [, changed] = await activeSlots();
    expect(changed.coachIds).toEqual([newCoachId]);
  });

  it('leaves the active schedule alone for a class that moved', async () => {
    const res = await saveTemplate([slot('10:00', newCoachId), slot('09:00', coachId)]);
    expect(res.status).toBe(200);

    const slots = await activeSlots();
    expect(slots.map((s) => s.coachIds)).toEqual([[coachId], [coachId]]);
  });
});
