import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FARM_STUDY_SOURCE, farmStudyRequest } from '../src/farm-native-study.mjs';

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
