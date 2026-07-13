import { apiFetch, apiFetchNoAuth, getFixture } from '../support/apiClient';
import { backdateSubMaxRecordedAt, createTestUser, deleteTestUser, disconnectDb } from '../support/db';

function findCurrent(data: any, templateId: string) {
  return data.currentBenchmarks.find((b: any) => b.templateId === templateId);
}

function findHistorical(data: any, id: string) {
  return data.historicalBenchmarks.find((b: any) => b.id === id);
}

async function resetTemplate(templateId: string) {
  const { json } = await apiFetch('GET', '/api/me/benchmarks');
  const existing = findCurrent(json.data, templateId);
  if (existing) {
    await apiFetch('DELETE', `/api/me/benchmarks/${existing.id}`);
  }
}

describe('updateMyBenchmark (PUT)', () => {
  let templateId: string;
  let oneRM: string;
  let fiveRM: string;
  let benchmarkId: string;

  beforeAll(async () => {
    const fixture = getFixture();
    templateId = fixture.templates.weight.templateId;
    oneRM = fixture.templates.weight.oneRM;
    fiveRM = fixture.templates.weight.fiveRM;
    await resetTemplate(templateId);

    const now = new Date().toISOString();
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [
        { templateRepMaxId: oneRM, weightKg: 100, recordedAt: now },
        { templateRepMaxId: fiveRM, weightKg: 80, recordedAt: now },
      ],
    });
    benchmarkId = findCurrent(res.json.data, templateId).id;
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('replaces the whole repMaxes array wholesale, without merging', async () => {
    const res = await apiFetch('PUT', `/api/me/benchmarks/${benchmarkId}`, {
      repMaxes: [{ templateRepMaxId: oneRM, weightKg: 999, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(200);
    expect(res.json.message).toBe('Benchmark updated successfully');
    expect(res.json.data.benchmark.repMaxes).toHaveLength(1);
    expect(res.json.data.benchmark.repMaxes[0].weightKg).toBe(999);
  });

  it('does not normalize physically inconsistent values', async () => {
    const res = await apiFetch('PUT', `/api/me/benchmarks/${benchmarkId}`, {
      repMaxes: [
        { templateRepMaxId: oneRM, weightKg: 10, recordedAt: new Date().toISOString() },
        { templateRepMaxId: fiveRM, weightKg: 999, recordedAt: new Date().toISOString() },
      ],
    });
    expect(res.status).toBe(200);
    const repMaxes = res.json.data.benchmark.repMaxes;
    expect(repMaxes.find((rm: any) => rm.templateRepMaxId === oneRM).weightKg).toBe(10);
    expect(repMaxes.find((rm: any) => rm.templateRepMaxId === fiveRM).weightKg).toBe(999);
  });

  it('can target a historical benchmark directly without moving it', async () => {
    // Force a new version so a historical entry exists.
    await backdateSubMaxRecordedAt({
      userId: getFixture().userId,
      benchmarkId,
      arrayField: 'repMaxes',
      idField: 'templateRepMaxId',
      bucketId: oneRM,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    });
    const versionRes = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [{ templateRepMaxId: oneRM, weightKg: 200, recordedAt: new Date().toISOString() }],
    });
    expect(versionRes.status).toBe(201);
    const historicalId = benchmarkId;
    expect(findHistorical(versionRes.json.data, historicalId)).toBeDefined();

    const putRes = await apiFetch('PUT', `/api/me/benchmarks/${historicalId}`, {
      notes: 'updated historical note',
    });
    expect(putRes.status).toBe(200);
    expect(putRes.json.data.benchmark.notes).toBe('updated historical note');

    const { json } = await apiFetch('GET', '/api/me/benchmarks');
    expect(findHistorical(json.data, historicalId).notes).toBe('updated historical note');
    expect(findCurrent(json.data, templateId).id).not.toBe(historicalId);
  });

  it('rejects an update with zero fields', async () => {
    const res = await apiFetch('PUT', `/api/me/benchmarks/${benchmarkId}`, {});
    expect(res.status).toBe(400);
    expect(res.json.error).toBe('Invalid benchmark data');
    expect(JSON.stringify(res.json.details)).toContain('At least one field must be updated');
  });

  it('accepts an update with only recordedAt (at-least-one, not exactly-one, semantics)', async () => {
    const res = await apiFetch('PUT', `/api/me/benchmarks/${benchmarkId}`, {
      recordedAt: new Date().toISOString(),
    });
    expect(res.status).toBe(200);
  });
});

describe('deleteMyBenchmark (DELETE)', () => {
  let templateId: string;
  let repsTemplateId: string;

  beforeAll(async () => {
    const fixture = getFixture();
    templateId = fixture.templates.weight.templateId;
    repsTemplateId = fixture.templates.reps.templateId;
    await resetTemplate(templateId);
    await resetTemplate(repsTemplateId);
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('deletes a current benchmark', async () => {
    const createRes = await apiFetch('POST', '/api/me/benchmarks', { templateId: repsTemplateId, reps: 10 });
    const benchmarkId = findCurrent(createRes.json.data, repsTemplateId).id;

    const deleteRes = await apiFetch('DELETE', `/api/me/benchmarks/${benchmarkId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.json.message).toBe('Benchmark deleted successfully');

    const { json } = await apiFetch('GET', '/api/me/benchmarks');
    expect(findCurrent(json.data, repsTemplateId)).toBeUndefined();
  });

  it('deletes a historical benchmark', async () => {
    const fixture = getFixture();
    const oneRM = fixture.templates.weight.oneRM;

    const v1 = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [{ templateRepMaxId: oneRM, weightKg: 100, recordedAt: new Date().toISOString() }],
    });
    const historicalId = findCurrent(v1.json.data, templateId).id;

    await backdateSubMaxRecordedAt({
      userId: fixture.userId,
      benchmarkId: historicalId,
      arrayField: 'repMaxes',
      idField: 'templateRepMaxId',
      bucketId: oneRM,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    });
    const v2 = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [{ templateRepMaxId: oneRM, weightKg: 110, recordedAt: new Date().toISOString() }],
    });
    expect(findHistorical(v2.json.data, historicalId)).toBeDefined();

    const deleteRes = await apiFetch('DELETE', `/api/me/benchmarks/${historicalId}`);
    expect(deleteRes.status).toBe(200);

    const { json } = await apiFetch('GET', '/api/me/benchmarks');
    expect(findHistorical(json.data, historicalId)).toBeUndefined();
  });

  it('returns 404 for a well-formed but nonexistent benchmark id', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await apiFetch('DELETE', `/api/me/benchmarks/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.json.error).toBe('Benchmark not found');
  });

  it('returns 404 for a malformed benchmark id', async () => {
    const res = await apiFetch('DELETE', '/api/me/benchmarks/not-an-id');
    expect(res.status).toBe(404);
    expect(res.json.error).toBe('Benchmark not found');
  });
});

describe('cross-tenant isolation', () => {
  let otherUserId: string;
  let otherUserToken: string;
  let benchmarkId: string;

  beforeAll(async () => {
    const fixture = getFixture();
    otherUserId = await createTestUser({
      email: 'test-integration-client-2@ironlogic4.test',
      userType: 'client',
      password: 'TestPassword123!',
    });

    const loginRes = await apiFetchNoAuth('POST', '/api/auth/login', {
      email: 'test-integration-client-2@ironlogic4.test',
      password: 'TestPassword123!',
    });
    otherUserToken = loginRes.json.data.accessToken;

    const repsTemplateId = fixture.templates.reps.templateId;
    const createRes = await apiFetch('POST', '/api/me/benchmarks', { templateId: repsTemplateId, reps: 10 }, otherUserToken);
    benchmarkId = findCurrent(createRes.json.data, repsTemplateId).id;
  });

  afterAll(async () => {
    await deleteTestUser(otherUserId);
    await disconnectDb();
  });

  it('cannot PUT another client\'s benchmark by id', async () => {
    const res = await apiFetch('PUT', `/api/me/benchmarks/${benchmarkId}`, { notes: 'hijacked' });
    expect(res.status).toBe(404);
  });

  it('cannot DELETE another client\'s benchmark by id', async () => {
    const res = await apiFetch('DELETE', `/api/me/benchmarks/${benchmarkId}`);
    expect(res.status).toBe(404);

    const { json } = await apiFetch('GET', '/api/me/benchmarks', undefined, otherUserToken);
    expect(json.data.currentBenchmarks.find((b: any) => b.id === benchmarkId)).toBeDefined();
  });
});
