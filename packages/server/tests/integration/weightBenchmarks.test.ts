import { apiFetch, getFixture } from '../support/apiClient';
import { backdateSubMaxRecordedAt, connectDb, disconnectDb } from '../support/db';

function findCurrent(data: any, templateId: string) {
  return data.currentBenchmarks.find((b: any) => b.templateId === templateId);
}

function findHistorical(data: any, id: string) {
  return data.historicalBenchmarks.find((b: any) => b.id === id);
}

function findRepMax(benchmark: any, bucketId: string) {
  return benchmark.repMaxes.find((rm: any) => rm.templateRepMaxId === bucketId);
}

describe('weight benchmarks (repMaxes)', () => {
  let templateId: string;
  let oneRM: string;
  let threeRM: string;
  let fiveRM: string;
  let tenRM: string;

  beforeAll(async () => {
    const fixture = getFixture();
    templateId = fixture.templates.weight.templateId;
    oneRM = fixture.templates.weight.oneRM;
    threeRM = fixture.templates.weight.threeRM;
    fiveRM = fixture.templates.weight.fiveRM;
    tenRM = fixture.templates.weight.tenRM;

    // Reset scratch state so this file can be rerun safely.
    const { json } = await apiFetch('GET', '/api/me/benchmarks');
    const existing = findCurrent(json.data, templateId);
    if (existing) {
      await apiFetch('DELETE', `/api/me/benchmarks/${existing.id}`);
    }
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it('narrative: create, edit-in-place, stale new-version, and cascading auto-correction', async () => {
    const now = new Date().toISOString();

    // Step 1: fresh create
    let res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [
        { templateRepMaxId: oneRM, weightKg: 100, recordedAt: now },
        { templateRepMaxId: fiveRM, weightKg: 80, recordedAt: now },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.json.message).toBe('Benchmark created successfully');
    let current = findCurrent(res.json.data, templateId);
    const benchmarkIdV1 = current.id;
    expect(findRepMax(current, oneRM).weightKg).toBe(100);
    expect(findRepMax(current, fiveRM).weightKg).toBe(80);
    const fiveRMOriginalRecordedAt = findRepMax(current, fiveRM).recordedAt;

    // Step 2: edit-in-place (fresh bucket, <5 days old)
    res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [{ templateRepMaxId: oneRM, weightKg: 105, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(200);
    expect(res.json.message).toBe('Benchmark updated in place');
    current = findCurrent(res.json.data, templateId);
    expect(current.id).toBe(benchmarkIdV1);
    expect(findRepMax(current, oneRM).weightKg).toBe(105);
    const fiveRMAfterEdit = findRepMax(current, fiveRM);
    expect(fiveRMAfterEdit.weightKg).toBe(80);
    expect(fiveRMAfterEdit.recordedAt).toBe(fiveRMOriginalRecordedAt);

    // Step 3: backdate 1RM past the 5-day staleness threshold
    await backdateSubMaxRecordedAt({
      userId: getFixture().userId,
      benchmarkId: benchmarkIdV1,
      arrayField: 'repMaxes',
      idField: 'templateRepMaxId',
      bucketId: oneRM,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    });

    // Step 4: resubmitting a stale bucket forces a new version
    res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [{ templateRepMaxId: oneRM, weightKg: 110, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(201);
    expect(res.json.message).toBe('New benchmark version created');
    current = findCurrent(res.json.data, templateId);
    const benchmarkIdV2 = current.id;
    expect(benchmarkIdV2).not.toBe(benchmarkIdV1);
    expect(findRepMax(current, oneRM).weightKg).toBe(110);
    expect(findRepMax(current, fiveRM).weightKg).toBe(80);
    const archivedV1 = findHistorical(res.json.data, benchmarkIdV1);
    expect(archivedV1).toBeDefined();
    expect(findRepMax(archivedV1, oneRM).weightKg).toBe(105);
    expect(findRepMax(archivedV1, fiveRM).weightKg).toBe(80);

    // Step 5: submitting a brand-new 10RM bucket that makes the existing 5RM physically
    // inconsistent (5RM must be >= 10RM) forces a new version via repMaxesWereAdjusted alone —
    // 10RM has no prior counterpart, so staleness alone would not have triggered this.
    res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [{ templateRepMaxId: tenRM, weightKg: 90, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(201);
    expect(res.json.message).toBe('New benchmark version created');
    current = findCurrent(res.json.data, templateId);
    const benchmarkIdV3 = current.id;
    expect(benchmarkIdV3).not.toBe(benchmarkIdV2);
    expect(findRepMax(current, oneRM).weightKg).toBe(110); // unaffected: 110 >= 90
    const fiveRMAfterCorrection = findRepMax(current, fiveRM);
    expect(fiveRMAfterCorrection.weightKg).toBe(90); // clamped up from 80
    expect(new Date(fiveRMAfterCorrection.recordedAt).getTime()).toBeGreaterThan(Date.now() - 60_000);
    expect(findRepMax(current, tenRM).weightKg).toBe(90);
    const archivedV2 = findHistorical(res.json.data, benchmarkIdV2);
    expect(archivedV2).toBeDefined();
    expect(findRepMax(archivedV2, fiveRM).weightKg).toBe(80); // true original value preserved
    expect(findRepMax(archivedV2, tenRM)).toBeUndefined();

    // Step 6: submitting a 3RM that's smaller than the existing 5RM/10RM (90) no longer clamps
    // them down — downward correction was removed after it caused real historical maxes to be
    // silently overwritten in production. With no counterpart and no adjustment, this is a plain
    // edit-in-place; 3RM is stored as submitted, and 5RM/10RM are left untouched.
    res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [{ templateRepMaxId: threeRM, weightKg: 50, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(200);
    expect(res.json.message).toBe('Benchmark updated in place');
    current = findCurrent(res.json.data, templateId);
    expect(current.id).toBe(benchmarkIdV3);
    expect(findRepMax(current, threeRM).weightKg).toBe(50);
    expect(findRepMax(current, fiveRM).weightKg).toBe(90);
    expect(findRepMax(current, tenRM).weightKg).toBe(90);
  });

  it('never clamps an existing higher-rep-count bucket down when a smaller lower-rep value is submitted (regression: previously overwrote real historical maxes)', async () => {
    let { json } = await apiFetch('GET', '/api/me/benchmarks');
    const existing = findCurrent(json.data, templateId);
    if (existing) {
      await apiFetch('DELETE', `/api/me/benchmarks/${existing.id}`);
    }

    const now = new Date().toISOString();
    let res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [{ templateRepMaxId: fiveRM, weightKg: 90, recordedAt: now }],
    });
    expect(res.status).toBe(201);
    let current = findCurrent(res.json.data, templateId);
    const benchmarkId = current.id;
    const fiveRMBeforeSubmission = findRepMax(current, fiveRM);

    res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [{ templateRepMaxId: oneRM, weightKg: 50, recordedAt: new Date().toISOString() }],
    });
    expect(res.status).toBe(200);
    expect(res.json.message).toBe('Benchmark updated in place');
    current = findCurrent(res.json.data, templateId);
    expect(current.id).toBe(benchmarkId);
    expect(findRepMax(current, oneRM).weightKg).toBe(50);
    const fiveRMAfterSubmission = findRepMax(current, fiveRM);
    expect(fiveRMAfterSubmission.weightKg).toBe(90);
    expect(fiveRMAfterSubmission.recordedAt).toBe(fiveRMBeforeSubmission.recordedAt);
  });

  it('fresh creation is never normalized, even with physically inconsistent values', async () => {
    // Reset: delete this template's current benchmark if one exists.
    let { json } = await apiFetch('GET', '/api/me/benchmarks');
    const existing = findCurrent(json.data, templateId);
    if (existing) {
      await apiFetch('DELETE', `/api/me/benchmarks/${existing.id}`);
    }

    const now = new Date().toISOString();
    const res = await apiFetch('POST', '/api/me/benchmarks', {
      templateId,
      repMaxes: [
        { templateRepMaxId: oneRM, weightKg: 50, recordedAt: now },
        { templateRepMaxId: fiveRM, weightKg: 80, recordedAt: now },
      ],
    });
    expect(res.status).toBe(201);
    const current = findCurrent(res.json.data, templateId);
    expect(findRepMax(current, oneRM).weightKg).toBe(50);
    expect(findRepMax(current, fiveRM).weightKg).toBe(80);
  });
});
