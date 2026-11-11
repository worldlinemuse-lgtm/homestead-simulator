import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regression for issue #23: check all four transformed bottom corners,
// rather than assuming a fixed roof elevation works at every coop depth.
const scene = readFileSync(new URL('../src/scene.js', import.meta.url), 'utf8');
test('native coop roof elevation uses footprint-dependent pitch clearance', () => {
  assert.match(scene, /const roofCenterY=top\+eaveDrop\+\.03/);
  assert.match(scene, /Math\.sin\(pitch\)\*roofDepth\/2/);
  assert.match(scene, /Math\.cos\(pitch\)\*roofThickness\/2/);
  for (const depth of [0.5, 1, 2, 4, 8, 12]) {
    const pitch = 0.34, thickness = 0.13;
    const roofDepth = depth / 2 + 0.25;
    const center = Math.sin(pitch) * roofDepth / 2 +
      Math.cos(pitch) * thickness / 2 + 0.03;
    for (const side of [-1, 1]) {
      for (const z of [-roofDepth / 2, roofDepth / 2]) {
        for (const y of [-thickness / 2, thickness / 2]) {
          const transformedY = center + y * Math.cos(side * pitch) -
            z * Math.sin(side * pitch);
          assert.ok(transformedY >= 0.03 - 1e-12,
            `roof corner below wall clearance: depth=${depth}, side=${side}`);
        }
      }
    }
  }
});
