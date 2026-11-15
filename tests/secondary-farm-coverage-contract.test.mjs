import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FARM_STUDY_SOURCE, farmStudyRequest, verifyFarmStudyResult } from '../src/farm-native-study.mjs';

const matrix = JSON.parse(readFileSync(new URL('../utility-coverage.json', import.meta.url), 'utf8'));
const byId = new Map(matrix.capabilities.map(c => [c.id, c]));
const upstream = matrix.upstreams.farm;

test('Farm source-native scenario identifies its pinned engine and real executable UI', () => {
  const c = byId.get('farm.native-daily-scenario');
  assert.ok(c, 'native daily scenario coverage record is required');
  assert.equal(c.status, 'integrated');
  assert.equal(c.upstreamRevision, upstream.revision);
  assert.equal(c.upstreamRevision, FARM_STUDY_SOURCE.revision);
  assert.equal(FARM_STUDY_SOURCE.repository, upstream.repository);
  assert.equal(c.adapter, 'src/farm-native-study.mjs');
  assert.ok(c.uiAccess?.includes('Main Utilities'));
  assert.ok(c.uiAccess?.includes('CSV'));
  assert.ok(c.tests?.some(p => p.includes('farm-native-study.test.mjs')));
  assert.equal(farmStudyRequest({days:7,seed:7}).days, 7);
});

test('Farm source-calendar metadata distinguishes original local-midnight ISO from normalized civil UI dates', () => {
  const c = byId.get('farm.native-daily-scenario');
  const dates = c?.units?.outputs?.dates;
  assert.equal(typeof dates, 'string');
  assert.match(dates, /source.local|local.midnight/i,
    'original Farm snapshot dates are local-midnight ISO timestamps, not invariant UTC dates');
  assert.match(dates, /civil|normalized/i,
    'worker output uses normalized civil dates independent of host timezone');
  assert.doesNotMatch(dates, /Gregorian UTC dates in original source simulator/i,
    'this description incorrectly asserts UTC calendar semantics for the original engine');
});

test('unintegrated native Farm annual planner and 10-seed range checks cannot masquerade as executable utilities', () => {
  for (const [id, fn] of [
    ['farm.native-year-planner', 'makePlan'],
    ['farm.native-range-check', 'runRange'],
  ]) {
    const c = byId.get(id);
    assert.ok(c, `${id} must be tracked explicitly`);
    assert.equal(c.upstreamRevision, upstream.revision);
    assert.equal(c.sourcePath, 'source/src/planner/planner.js');
    assert.match(c.sourceInterface, new RegExp(fn));
    if (c.status === 'not-integrated') {
      assert.equal(c.adapter, null);
      assert.equal(c.ui, null);
      assert.deepEqual(c.tests, []);
    } else {
      assert.equal(c.status, 'integrated', `${id} must not be presented as partial native parity`);
      assert.ok(c.adapter && c.ui && c.tests?.length,
        `${id} requires executable adapter, UI and tests before integration claim`);
    }
  }
});

test('Farm original controls reject forged keys, nonfinite inputs and boundary violations without mutating callers', () => {
  const original = { mg_does: 0, mg_hens: 60, mg_roosters: 10, mg_set: 25 };
  const snapshot = structuredClone(original);
  const accepted = farmStudyRequest({ seed: 4294967295, days: 90, parameters: original });
  assert.deepEqual(original, snapshot, 'caller configuration must remain untouched');
  assert.deepEqual(accepted.parameters, original);
  assert.ok(Object.isFrozen(accepted));
  assert.ok(Object.isFrozen(accepted.parameters));
  for (const seed of [-1, 4294967296, 1.5, NaN, Infinity, '7', null]) {
    assert.throws(() => farmStudyRequest({ seed }), RangeError);
  }
  for (const days of [0, 6, 8, 29, 31, 89, 91, NaN, Infinity, '7']) {
    assert.throws(() => farmStudyRequest({ days }), RangeError);
  }
  for (const parameters of [null, [], 'mg_does', { mg_does: NaN },
    { mg_does: Infinity }, { mg_does: -1 }, { mg_does: 21 },
    { mg_hens: 61 }, { mg_roosters: 11 }, { mg_set: 26 },
    { mg_set: 1.5 }, { mg_does: '6' }, { __proto_forged: 1 }]) {
    assert.throws(() => farmStudyRequest({ parameters }), RangeError);
  }
  assert.deepEqual(farmStudyRequest({ seed: 0, days: 7, parameters: {
    mg_does: 0, mg_hens: 0, mg_roosters: 0, mg_set: 0
  }}).parameters, { mg_does: 0, mg_hens: 0, mg_roosters: 0, mg_set: 0 });
});

function validNativeResponse(req) {
  const initial = { day: 0, date: '2026-11-04', animals: 1, eggs: null, waterGal: null, electricityKWh: null };
  const series = Array.from({ length: req.days }, (_, i) => {
    const date = new Date(Date.UTC(2026, 10, 5 + i)).toISOString().slice(0, 10);
    return { day: i + 1, date, animals: 1, eggs: 0, waterGal: 0, electricityKWh: 0 };
  });
  return { schema: 1, kind: 'isolated-native-farm-daily-scenario',
    source: { ...FARM_STUDY_SOURCE }, seed: req.seed, days: req.days,
    parameters: { ...req.parameters }, initial, series,
    final: { ...series.at(-1) }, totals: { eggs: 0, waterGal: 0, electricityKWh: 0 },
    limitations: ['Isolated study, not a live mutation', 'Original source model assumptions apply'] };
}

test('Farm result validator preserves genuine zero but rejects missing, forged and nonfinite source ledgers', () => {
  const req = farmStudyRequest({ days: 7, seed: 0 });
  const valid = validNativeResponse(req);
  assert.equal(verifyFarmStudyResult(structuredClone(valid), req).totals.eggs, 0);
  for (const bad of [null, undefined, NaN, Infinity, -1, '0']) {
    const response = structuredClone(valid);
    if (bad === undefined) delete response.series[0].eggs;
    else response.series[0].eggs = bad;
    assert.throws(() => verifyFarmStudyResult(response, req), RangeError);
  }
  for (const tamper of [
    r => { r.source.revision = 'forged'; },
    r => { r.source.unexpected = true; },
    r => { r.parameters.mg_hens += 1; },
    r => { r.initial.eggs = 0; },
    r => { r.initial.date = '2026-11-05'; },
    r => { r.series[1].date = r.series[0].date; },
    r => { r.series[1].date = '2026-02-30'; },
    r => { r.series[1].day = 99; },
    r => { r.series[1].waterGal = Infinity; },
    r => { r.totals.waterGal = 1; },
    r => { r.final.eggs = 2; },
    r => { r.limitations = [' ', '']; }
  ]) {
    const response = structuredClone(valid);
    tamper(response);
    assert.throws(() => verifyFarmStudyResult(response, req), RangeError);
  }
  assert.deepEqual(validNativeResponse(req), valid, 'validation must not mutate the original fixture');
});

test('Farm 30/90-day native response preserves year-boundary chronology and conservation', () => {
  for (const days of [30, 90]) {
    const req = farmStudyRequest({days, seed: 4294967295});
    const response = validNativeResponse(req);
    response.series.forEach((row, i) => {
      row.eggs = i % 4;
      row.waterGal = (i + 1) / 8;
      row.electricityKWh = i / 16;
    });
    response.final = {...response.series.at(-1)};
    for (const key of ['eggs', 'waterGal', 'electricityKWh'])
      response.totals[key] = response.series.reduce((sum, row) => sum + row[key], 0);
    const before = structuredClone(response);
    verifyFarmStudyResult(response, req);
    assert.equal(response.series.at(-1).date, days === 90 ? '2027-02-02' : '2026-12-04');
    assert.deepEqual(response, before, 'validation must not mutate native response');
    for (const key of ['eggs', 'waterGal', 'electricityKWh']) {
      const forged = structuredClone(response);
      forged.totals[key] += 1;
      assert.throws(() => verifyFarmStudyResult(forged, req), RangeError);
    }
    for (const key of ['animals', 'eggs', 'waterGal', 'electricityKWh']) {
      const forged = structuredClone(response);
      forged.series.at(-1)[key] = -0.001;
      assert.throws(() => verifyFarmStudyResult(forged, req), RangeError);
    }
  }
});

test('Farm result rejects malformed identities, shapes, dates and initial measurements', () => {
  const req = farmStudyRequest({days: 7});
  const valid = validNativeResponse(req);
  for (const change of [
    r => { r.schema = '1'; },
    r => { r.kind = 'unknown'; },
    r => { r.source = []; },
    r => { r.parameters = null; },
    r => { r.series = {}; },
    r => { r.series.pop(); },
    r => { r.initial.animals = NaN; },
    r => { r.initial.animals = -1; },
    r => { r.initial.waterGal = 0; },
    r => { r.series[0].animals = '1'; },
    r => { r.series[0].date = '2026-11-06'; },
    r => { r.final = null; },
    r => { r.totals.eggs = NaN; },
    r => { r.limitations = null; }
  ]) {
    const response = structuredClone(valid);
    change(response);
    assert.throws(() => verifyFarmStudyResult(response, req), RangeError);
  }
});


test('Farm worker lifecycle rejects forged responses, errors and initialization failures without leaking workers', async () => {
  const { runNativeFarmDailyStudy } = await import('../src/farm-native-study.mjs');
  const req = farmStudyRequest({days: 7, seed: 11});
  for (const scenario of ['valid', 'forged', 'worker-error', 'failed-response']) {
    const calls = {terminated: 0, posted: null};
    const worker = {
      listeners: {},
      addEventListener(type, handler) { this.listeners[type] = handler; },
      terminate() { calls.terminated++; },
      postMessage(value) {
        calls.posted = value;
        queueMicrotask(() => {
          if (scenario === 'worker-error') this.listeners.error({message:'injected source failure'});
          else if (scenario === 'failed-response') this.listeners.message({data:{ok:false,error:'source rejected'}});
          else {
            const response = validNativeResponse(req);
            if (scenario === 'forged') response.source.revision = 'forged';
            this.listeners.message({data:{ok:true,result:response}});
          }
        });
      }
    };
    const promise = runNativeFarmDailyStudy({days:7,seed:11}, () => worker);
    if (scenario === 'valid') {
      assert.equal((await promise).totals.eggs, 0);
    } else {
      await assert.rejects(promise, scenario === 'forged' ? RangeError : Error);
    }
    assert.deepEqual(calls.posted, req, 'worker must receive the immutable normalized source request');
    assert.equal(calls.terminated, 1, 'every terminal path must terminate its isolated worker');
  }
  await assert.rejects(
    runNativeFarmDailyStudy({days:7}, () => ({postMessage() {}})),
    /worker could not initialize/
  );
});
