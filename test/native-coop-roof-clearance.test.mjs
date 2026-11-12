import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeCoopRoofPlacement} from '../src/coop-roof-geometry.mjs';

test('native coop roof underside seats on both support walls for varied depths', () => {
  for (const depth of [0.5,1,2,4,8,12]) {
    const {panelDepth,pitch,thickness,centerAboveWall}=nativeCoopRoofPlacement(depth);
    for (const side of [-1,1]) {
      // Inverse rotation: at the wall line, the lower surface has local y=-t/2.
      const supportZ=side*depth/4;
      const localY=-thickness/2;
      const localZ=(supportZ-localY*Math.sin(side*pitch))/Math.cos(pitch);
      assert.ok(Math.abs(localZ)<=panelDepth/2,
        'support line must intersect the actual roof panel');
      const underside=centerAboveWall+
        localY*Math.cos(pitch)-localZ*Math.sin(side*pitch);
      assert.ok(Math.abs(underside)<1e-10,
        `support gap depth=${depth} side=${side}: ${underside}`);
      // The outer eave must project beyond the support, not penetrate the wall.
      assert.ok(panelDepth/2*Math.cos(pitch)>depth/4,
        `missing overhang depth=${depth}`);
    }
  }
});

test('reject invalid roof dimensions', () => {
  for (const depth of [0,-1,NaN,Infinity]) {
    assert.throws(()=>nativeCoopRoofPlacement(depth),RangeError);
  }
});
