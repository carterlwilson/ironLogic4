import { apiFetch, getFixture } from '../support/apiClient';
import { backdateBenchmarkRecordedAt, disconnectDb } from '../support/db';

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

describe('reps benchmark (scalar)', () => {
  let templateId: string;

  beforeAll(async () => {
    templateId = getFixture().templates.reps.templateId;
    await resetTemplate(templateId);
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('fresh create, edit-in-place, then backdate + resubmit forces a new version', async () => {
    const now = new Date().toISOString();
    let res = await apiFetch('POST', '/api/me/benchmarks', { templateId, reps: 20, recordedAt: now });
    expect(res.status).toBe(201);
    let current = findCurrent(res.json.data, templateId);
    const benchmarkIdV1 = current.id;
    expect(current.reps).toBe(20);

    res = await apiFetch('POST', '/api/me/benchmarks', { templateId, reps: 22, recordedAt: new Date().toISOString() });
    expect(res.status).toBe(200);
    expect(res.json.message).toBe('Benchmark updated in place');
    current = findCurrent(res.json.data, templateId);
    expect(current.id).toBe(benchmarkIdV1);
    expect(current.reps).toBe(22);

    await backdateBenchmarkRecordedAt(getFixture().userId, benchmarkIdV1, new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

    res = await apiFetch('POST', '/api/me/benchmarks', { templateId, reps: 25, recordedAt: new Date().toISOString() });
    expect(res.status).toBe(201);
    expect(res.json.message).toBe('New benchmark version created');
    current = findCurrent(res.json.data, templateId);
    expect(current.id).not.toBe(benchmarkIdV1);
    expect(current.reps).toBe(25);

    const archived = findHistorical(res.json.data, benchmarkIdV1);
    expect(archived).toBeDefined();
    expect(archived.reps).toBe(22);
  });

  it('never triggers a new version if recordedAt is never submitted', async () => {
    await resetTemplate(templateId);

    let res = await apiFetch('POST', '/api/me/benchmarks', { templateId, reps: 5 });
    expect(res.status).toBe(201);
    const current = findCurrent(res.json.data, templateId);
    expect(current.recordedAt).toBeFalsy();

    res = await apiFetch('POST', '/api/me/benchmarks', { templateId, reps: 6 });
    expect(res.status).toBe(200);
    expect(res.json.message).toBe('Benchmark updated in place');
  });
});

describe('other benchmark (scalar otherNotes)', () => {
  let templateId: string;

  beforeAll(async () => {
    templateId = getFixture().templates.other.templateId;
    await resetTemplate(templateId);
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('fresh create, edit-in-place, then backdate + resubmit forces a new version', async () => {
    const now = new Date().toISOString();
    let res = await apiFetch('POST', '/api/me/benchmarks', { templateId, otherNotes: 'Ran a 5k', recordedAt: now });
    expect(res.status).toBe(201);
    let current = findCurrent(res.json.data, templateId);
    const benchmarkIdV1 = current.id;
    expect(current.otherNotes).toBe('Ran a 5k');

    res = await apiFetch('POST', '/api/me/benchmarks', { templateId, otherNotes: 'Ran a 10k', recordedAt: new Date().toISOString() });
    expect(res.status).toBe(200);
    current = findCurrent(res.json.data, templateId);
    expect(current.id).toBe(benchmarkIdV1);

    await backdateBenchmarkRecordedAt(getFixture().userId, benchmarkIdV1, new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

    res = await apiFetch('POST', '/api/me/benchmarks', { templateId, otherNotes: 'Ran a half marathon', recordedAt: new Date().toISOString() });
    expect(res.status).toBe(201);
    expect(res.json.message).toBe('New benchmark version created');
    current = findCurrent(res.json.data, templateId);
    expect(current.id).not.toBe(benchmarkIdV1);

    const archived = findHistorical(res.json.data, benchmarkIdV1);
    expect(archived.otherNotes).toBe('Ran a 10k');
  });
});
