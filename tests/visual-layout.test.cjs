"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
test("solar legs terminate beneath the tilted rack for both supports",async()=>{
 const {solarPostMount,SOLAR_RACK,RABBIT_HUTCH_ROOF}=await import("../src/visual-layout.mjs");
 for(const terrain of [-.6,-.1,.3])for(const z of [-.75,.88]){
   const p=solarPostMount(z,terrain);
   assert.ok(p.lengthM>0);
   assert.ok(p.clearanceM>=.099);
   assert.ok(p.postTopM < p.undersideM);
   // Three.js RotationX: world Y = -sin(angle) * local Z.
   const actualRackUnderside=SOLAR_RACK.heightM-
     Math.sin(SOLAR_RACK.tiltRad)*z-
     SOLAR_RACK.halfThicknessM*Math.cos(SOLAR_RACK.tiltRad);
   assert.ok(Math.abs(p.undersideM-actualRackUnderside)<1e-10,
     "support top must follow the tilted mesh, not the mirrored slope");
   assert.ok(p.postBottomM<=terrain-.2);
 }
 assert.equal(SOLAR_RACK.heightM,2.15);
 assert.ok((RABBIT_HUTCH_ROOF.roofWidthM-RABBIT_HUTCH_ROOF.cageWidthM)/2<.13);
 assert.ok((RABBIT_HUTCH_ROOF.roofDepthM-RABBIT_HUTCH_ROOF.cageDepthM)/2<.13);
 assert.throws(()=>solarPostMount(NaN,0));
});
