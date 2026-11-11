"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
test("solar legs terminate beneath the tilted rack for both supports",async()=>{
 const {solarPostMount,SOLAR_RACK,RABBIT_HUTCH_ROOF}=await import("../src/visual-layout.mjs");
 for(const terrain of [-.6,-.1,.3])for(const z of [-.75,.88]){
   const p=solarPostMount(z,terrain);
   assert.ok(p.lengthM>0);
   assert.ok(p.clearanceM>=.05 && p.clearanceM<.06);
   assert.ok(p.postTopM < p.undersideM);
   // Independent rotated-box plane intersection at fixed world Z. The
   // vertical post is NOT at the same local Z as the pitched rack surface.
   const yLocal=-SOLAR_RACK.halfThicknessM;
   const zLocal=(z-yLocal*Math.sin(SOLAR_RACK.tiltRad))/Math.cos(SOLAR_RACK.tiltRad);
   const actualRackUnderside=SOLAR_RACK.heightM+
     yLocal*Math.cos(SOLAR_RACK.tiltRad)-zLocal*Math.sin(SOLAR_RACK.tiltRad);
   assert.ok(Math.abs(p.undersideM-actualRackUnderside)<1e-10,
     "support top must follow the tilted mesh, not the mirrored slope");
   assert.ok(p.postBottomM<=terrain-.2);
   // A 0.11m-radius vertical post cannot pierce the rack at either edge.
   const edgeVariation=0.11*Math.abs(Math.tan(SOLAR_RACK.tiltRad));
   assert.ok(p.clearanceM>edgeVariation+0.01);
 }
 assert.equal(SOLAR_RACK.heightM,2.15);
 assert.ok((RABBIT_HUTCH_ROOF.roofWidthM-RABBIT_HUTCH_ROOF.cageWidthM)/2<.13);
 assert.ok((RABBIT_HUTCH_ROOF.roofDepthM-RABBIT_HUTCH_ROOF.cageDepthM)/2<.13);
 assert.throws(()=>solarPostMount(NaN,0));
});
