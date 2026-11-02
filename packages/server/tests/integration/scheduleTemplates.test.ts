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
let ownerToken: string;
let templateId: string;

beforeAll(async () => {
  ownerId = await createGymUser('test-tmpl-owner@ironlogic4.test', 'owner', gymId);
  clientId = await createGymUser('test-tmpl-client@ironlogic4.test', 'client', gymId);
  otherGymClientId = await createGymUser('test-tmpl-othergym@ironlogic4.test', 'client', otherGymId);
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
});

afterAll(async () => {
  const conn = await connectDb();
  await conn.collection('scheduletemplates').deleteOne({ _id: new mongoose.Types.ObjectId(templateId) });
  for (const id of [ownerId, clientId, otherGymClientId]) {
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
