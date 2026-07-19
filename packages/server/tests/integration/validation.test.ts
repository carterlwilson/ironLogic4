import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';
import { apiFetch, apiFetchNoAuth, getFixture } from '../support/apiClient';
import { createTestUser, deleteTestUser, disconnectDb } from '../support/db';

dotenv.config({ path: path.join(__dirname, '../../.env') });

describe('CreateMyBenchmarkSchema validation', () => {
  let weightTemplateId: string;
  let repsTemplateId: string;

  beforeAll(() => {
    const fixture = getFixture();
    weightTemplateId = fixture.templates.weight.templateId;
    repsTemplateId = fixture.templates.reps.templateId;
  });

  it('rejects two measurement fields submitted at once', async () => {
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId: repsTemplateId,
      reps: 10,
      otherNotes: 'also this',
    });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe('Invalid benchmark data');
    expect(JSON.stringify(res.json.details)).toContain('Exactly one measurement type must be provided');
  });

  it('rejects zero measurement fields', async () => {
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId: repsTemplateId,
      notes: 'no measurement here',
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.json.details)).toContain('Exactly one measurement type must be provided');
  });

  it('rejects a measurement type mismatched with the template', async () => {
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId: weightTemplateId,
      reps: 10,
    });
    expect(res.status).toBe(400);
    expect(res.json.error).toBe('This template requires a weight measurement');
  });

  it('returns 404 for a well-formed but nonexistent templateId', async () => {
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId: '507f1f77bcf86cd799439011',
      reps: 10,
    });
    expect(res.status).toBe(404);
    expect(res.json.error).toBe('Benchmark template not found');
  });

  it('handles a malformed templateId (documenting actual behavior)', async () => {
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId: 'not-an-id',
      reps: 10,
    });
    // BenchmarkTemplate.findById('not-an-id') is expected to throw an uncaught Mongoose
    // CastError, falling into the generic catch-all (500) rather than a clean 400/404.
    expect(res.status).toBe(500);
    expect(res.json.error).toBe('Failed to create benchmark');
  });
});

describe('authentication and authorization', () => {
  it('rejects requests with no Authorization header', async () => {
    const res = await apiFetchNoAuth('GET', '/api/me/benchmarks');
    expect(res.status).toBe(401);
    expect(res.json.error).toBe('Access token is required');
  });

  it('rejects a malformed bearer token', async () => {
    const res = await apiFetch('GET', '/api/me/benchmarks', undefined, 'garbage-token');
    expect(res.status).toBe(401);
    expect(res.json.error).toBe('Invalid or expired token');
  });

  it('rejects a well-signed but expired token', async () => {
    const expiredToken = jwt.sign({ userId: getFixture().userId }, process.env.JWT_SECRET!, {
      expiresIn: -1,
    });
    const res = await apiFetch('GET', '/api/me/benchmarks', undefined, expiredToken);
    expect(res.status).toBe(401);
    expect(res.json.error).toBe('Invalid or expired token');
  });

  it('rejects unauthenticated POST the same way as GET', async () => {
    const res = await apiFetchNoAuth('POST', '/api/me/benchmarks', { templateId: 'x', reps: 1 });
    expect(res.status).toBe(401);
  });

  describe('non-CLIENT role', () => {
    let coachUserId: string;
    let coachToken: string;

    beforeAll(async () => {
      coachUserId = await createTestUser({
        email: 'test-integration-coach@ironlogic4.test',
        userType: 'coach',
        password: 'TestPassword123!',
      });
      const loginRes = await apiFetchNoAuth('POST', '/api/auth/login', {
        email: 'test-integration-coach@ironlogic4.test',
        password: 'TestPassword123!',
      });
      coachToken = loginRes.json.data.accessToken;
    });

    afterAll(async () => {
      await deleteTestUser(coachUserId);
      await disconnectDb();
    });

    it('rejects a COACH-role user with 403', async () => {
      const res = await apiFetch('GET', '/api/me/benchmarks', undefined, coachToken);
      expect(res.status).toBe(403);
      expect(res.json.error).toBe('This endpoint is only accessible to clients');
    });
  });
});
