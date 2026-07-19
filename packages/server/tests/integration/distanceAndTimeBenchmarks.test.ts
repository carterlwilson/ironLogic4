import { apiFetch, getFixture } from '../support/apiClient';
import { backdateSubMaxRecordedAt, disconnectDb } from '../support/db';

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

describe('distance benchmarks (timeSubMaxes)', () => {
  let templateId: string;
  let min1: string;
  let min3: string;

  beforeAll(async () => {
    const fixture = getFixture();
    templateId = fixture.templates.distance.templateId;
    min1 = fixture.templates.distance.min1;
    min3 = fixture.templates.distance.min3;
    await resetTemplate(templateId);
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('fresh create stores values as submitted', async () => {
    const now = new Date().toISOString();
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      timeSubMaxes: [
        { templateSubMaxId: min1, distanceMeters: 250, recordedAt: now },
        { templateSubMaxId: min3, distanceMeters: 600, recordedAt: now },
      ],
    });
    expect(res.status).toBe(201);
    const current = findCurrent(res.json.data, templateId);
    expect(current.timeSubMaxes.find((s: any) => s.templateSubMaxId === min1).distanceMeters).toBe(250);
    expect(current.timeSubMaxes.find((s: any) => s.templateSubMaxId === min3).distanceMeters).toBe(600);
  });

  it('has no bound-checking: a physically implausible edit is stored uncorrected', async () => {
    // min1 (1-minute distance) exceeding min3 (3-minute distance) is implausible, but DISTANCE
    // type has no normalization logic (that's WEIGHT/repMaxes-only) — confirm it's not corrected.
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      timeSubMaxes: [{ templateSubMaxId: min1, distanceMeters: 900, recordedAt: new Date().toISOString() }],
    });
    // min1 was just created moments ago (fresh, <5 days old), so this is an edit-in-place, not
    // a new version — asserting the exact status pins down that expectation.
    expect(res.status).toBe(200);
    const current = findCurrent(res.json.data, templateId);
    expect(current.timeSubMaxes.find((s: any) => s.templateSubMaxId === min1).distanceMeters).toBe(900);
    expect(current.timeSubMaxes.find((s: any) => s.templateSubMaxId === min3).distanceMeters).toBe(600);
  });

  it('edit-in-place, then backdate + resubmit forces a new version preserving history', async () => {
    let { json } = await apiFetch('GET', '/api/me/benchmarks');
    let current = findCurrent(json.data, templateId);
    const benchmarkIdV1 = current.id;

    // Edit-in-place: min1 is fresh (<5 days).
    let res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      timeSubMaxes: [{ templateSubMaxId: min1, distanceMeters: 300, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(200);
    expect(res.json.message).toBe('Benchmark updated in place');
    current = findCurrent(res.json.data, templateId);
    expect(current.id).toBe(benchmarkIdV1);
    expect(current.timeSubMaxes.find((s: any) => s.templateSubMaxId === min3).distanceMeters).toBe(600);

    // Backdate min1 past staleness threshold, resubmit.
    await backdateSubMaxRecordedAt({
      userId: getFixture().userId,
      benchmarkId: benchmarkIdV1,
      arrayField: 'timeSubMaxes',
      idField: 'templateSubMaxId',
      bucketId: min1,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    });

    res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      timeSubMaxes: [{ templateSubMaxId: min1, distanceMeters: 320, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(201);
    expect(res.json.message).toBe('New benchmark version created');
    current = findCurrent(res.json.data, templateId);
    expect(current.id).not.toBe(benchmarkIdV1);
    expect(current.timeSubMaxes.find((s: any) => s.templateSubMaxId === min1).distanceMeters).toBe(320);
    expect(current.timeSubMaxes.find((s: any) => s.templateSubMaxId === min3).distanceMeters).toBe(600);

    const archived = findHistorical(res.json.data, benchmarkIdV1);
    expect(archived).toBeDefined();
    expect(archived.timeSubMaxes.find((s: any) => s.templateSubMaxId === min1).distanceMeters).toBe(300);
  });
});

describe('time benchmarks (distanceSubMaxes and legacy scalar timeSeconds)', () => {
  let templateId: string;
  let m100: string;
  let m500: string;

  beforeAll(async () => {
    const fixture = getFixture();
    templateId = fixture.templates.time.templateId;
    m100 = fixture.templates.time.m100;
    m500 = fixture.templates.time.m500;
    await resetTemplate(templateId);
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('fresh create with distanceSubMaxes stores values as submitted', async () => {
    const now = new Date().toISOString();
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      distanceSubMaxes: [
        { templateDistanceSubMaxId: m100, timeSeconds: 15.2, recordedAt: now },
        { templateDistanceSubMaxId: m500, timeSeconds: 95, recordedAt: now },
      ],
    });
    expect(res.status).toBe(201);
    const current = findCurrent(res.json.data, templateId);
    expect(current.distanceSubMaxes.find((s: any) => s.templateDistanceSubMaxId === m100).timeSeconds).toBe(15.2);
  });

  it('edit-in-place, then backdate + resubmit forces a new version', async () => {
    let { json } = await apiFetch('GET', '/api/me/benchmarks');
    let current = findCurrent(json.data, templateId);
    const benchmarkIdV1 = current.id;

    let res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      distanceSubMaxes: [{ templateDistanceSubMaxId: m100, timeSeconds: 15.0, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(200);
    expect(res.json.message).toBe('Benchmark updated in place');

    await backdateSubMaxRecordedAt({
      userId: getFixture().userId,
      benchmarkId: benchmarkIdV1,
      arrayField: 'distanceSubMaxes',
      idField: 'templateDistanceSubMaxId',
      bucketId: m100,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    });

    res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      distanceSubMaxes: [{ templateDistanceSubMaxId: m100, timeSeconds: 14.5, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(201);
    expect(res.json.message).toBe('New benchmark version created');
    current = findCurrent(res.json.data, templateId);
    expect(current.id).not.toBe(benchmarkIdV1);
  });

  it('supports the legacy bare timeSeconds field alongside distanceSubMaxes on the same TIME-type template', async () => {
    await resetTemplate(templateId);

    // Bare scalar timeSeconds is valid for a TIME-type template even though this template's
    // declared shape uses distanceSubMaxes buckets — ClientBenchmark.ts's pre-save hook
    // explicitly documents both as supported ("legacy" timeSeconds vs. "new multi-distance").
    let res = await apiFetch('POST', '/api/me/benchmarks', { templateId, timeSeconds: 42 });
    expect(res.status).toBe(201);
    let current = findCurrent(res.json.data, templateId);
    expect(current.timeSeconds).toBe(42);
    expect(current.distanceSubMaxes ?? []).toHaveLength(0);

    // Submitting distanceSubMaxes afterward (no prior counterpart, so edit-in-place applies)
    // results in both fields coexisting on the same record.
    res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      distanceSubMaxes: [{ templateDistanceSubMaxId: m100, timeSeconds: 15.0, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(200);
    expect(res.json.message).toBe('Benchmark updated in place');
    current = findCurrent(res.json.data, templateId);
    expect(current.timeSeconds).toBe(42);
    expect(current.distanceSubMaxes).toHaveLength(1);
  });
});
