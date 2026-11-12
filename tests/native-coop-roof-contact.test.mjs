import test from "node:test";
import assert from "node:assert/strict";
import {nativeCoopRoofPlacement,nativeCoopGableProfile} from "../src/coop-roof-geometry.mjs";

// Independent cross-section of a rotated, finite-thickness roof slab.
// At a horizontal displacement x from its center, the lower surface is
// y = centerY - tan(pitch)*x - thickness/(2*cos(pitch)).
function undersideAt(centerY, pitch, thickness, displacement) {
  return centerY - Math.tan(pitch)*displacement -
    thickness/(2*Math.cos(pitch));
}

test("native coop roof panels touch their actual wall support lines", () => {
  for (const depth of [1.2, 2.44, 3.5, 6.0]) {
    for (const pitch of [0.18, 0.34, 0.52]) {
      const thickness=0.13;
      const roof=nativeCoopRoofPlacement(depth,{pitch,thickness,overhang:0.125});
      const supportX=depth/4;
      const contact=undersideAt(roof.centerAboveWall,pitch,thickness,supportX);
      assert.ok(Math.abs(contact)<1e-10,
        `roof/wall separation ${contact} m at depth ${depth}, pitch ${pitch}`);
      const ridge=undersideAt(roof.centerAboveWall,pitch,thickness,-supportX);
      const eave=undersideAt(roof.centerAboveWall,pitch,thickness,supportX);
      assert.ok(ridge>eave,`roof is inverted at depth ${depth}`);
      // The projected panel must extend past the supporting wall.
      const projectedHalfSpan=(roof.panelDepth/2)*Math.cos(pitch)+
        (thickness/2)*Math.sin(pitch);
      assert.ok(projectedHalfSpan>supportX,
        `roof panel ends before the wall at depth ${depth}`);
    }
  }
});

test("native coop roof rejects nonphysical dimensions", () => {
  for (const depth of [0,-1,NaN,Infinity]) {
    assert.throws(()=>nativeCoopRoofPlacement(depth),RangeError);
  }
  for (const options of [{pitch:0},{pitch:Math.PI/2},{thickness:0},
    {overhang:-0.1},{pitch:NaN}]) {
    assert.throws(()=>nativeCoopRoofPlacement(2.44,options),RangeError);
  }
});

test("gable infill closes native roof-end triangle for all supported depths and pitches",()=>{
  for(const depth of [1.2,2.44,3.5,6.0])for(const pitch of [0.18,0.34,0.52]){
    const g=nativeCoopGableProfile(depth,{pitch});
    assert.equal(g.leftZ,-depth/2);
    assert.equal(g.rightZ,depth/2);
    assert.equal(g.ridgeZ,0);
    assert.equal(g.baseY,0);
    assert.ok(Math.abs(g.ridgeY-Math.tan(pitch)*depth/2)<1e-12);
    // Each half-gable follows the underside slope, meeting both roof supports.
    for(const z of [g.leftZ,-depth/4,0,depth/4,g.rightZ]){
      const edgeY=g.ridgeY*(1-2*Math.abs(z)/depth);
      assert.ok(edgeY>=-1e-12 && edgeY<=g.ridgeY+1e-12);
    }
  }
  assert.throws(()=>nativeCoopGableProfile(0),RangeError);
});
