"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
test("actual Three.js utility splines avoid farm rail and post centerlines",async()=>{
 const THREE=await import("../vendor/three.module.min.js");
 const {FARM_PERIMETER,FARM_ELECTRICAL_ROUTE,FARM_WATER_SUPPLY_ROUTE,
   utilityFenceClearance}=await import("../src/plot-layout.mjs");
 const spline=(nodes)=>new THREE.CatmullRomCurve3(
   nodes.map(([x,z,h])=>new THREE.Vector3(x,h,z)),false,"centripetal",.35);
 const sample=nodes=>spline(nodes).getPoints(256).map(p=>[p.x,p.z]);
 const electricClearance=utilityFenceClearance(sample(FARM_ELECTRICAL_ROUTE));
 const waterClearance=utilityFenceClearance(sample(FARM_WATER_SUPPLY_ROUTE));
 assert.ok(electricClearance>0.36, "electrical feeder crosses farm fence: "+electricClearance);
 assert.ok(waterClearance>0.36, "water pipe crosses fence outside gate: "+waterClearance);
 const gate=spline(FARM_WATER_SUPPLY_ROUTE).getPoints(256)
   .filter(p=>Math.abs(p.z+2)<.3);
 assert.ok(gate.length>0,"water supply must cross farm access gate");
 for(const p of gate){
   assert.ok(p.x>28.35+.36&&p.x<31.65-.36,
     "water supply must cross through actual 3.3m gate: "+p.x);
   assert.ok(p.y<-.40,"gate crossing path must be buried, not at walking height: "+p.y);
 }
 assert.equal(FARM_PERIMETER.length,5);
});
test("property route regression catches both original crossings and segment overlap",async()=>{
 const {utilityFenceClearance}=await import("../src/plot-layout.mjs");
 const originalElectric=[[6,8],[15,8],[22,2],[28,-9]];
 const originalSupply=[[12,-17],[19,-15],[23,-7],[25,3],[29,5]];
 assert.equal(utilityFenceClearance(originalElectric),0);
 assert.equal(utilityFenceClearance(originalSupply),0);
 assert.equal(utilityFenceClearance([[20,-2],[24,-2]]),0);
 assert.ok(utilityFenceClearance([[5,-2],[6,-2]])>1);
 for(const bad of [[],[[0,0]],[[0,0],[NaN,2]]])
   assert.throws(()=>utilityFenceClearance(bad),/segment|finite/);
});
test("route endpoints retain original visual equipment connections",async()=>{
 const {FARM_ELECTRICAL_ROUTE,FARM_WATER_SUPPLY_ROUTE}=await import("../src/plot-layout.mjs");
 assert.deepEqual([...FARM_ELECTRICAL_ROUTE[0]],[6,8,.6]);
 assert.deepEqual([...FARM_ELECTRICAL_ROUTE.at(-1)],[28,-9,.55]);
 assert.deepEqual([...FARM_WATER_SUPPLY_ROUTE[0]],[12,-17,.35]);
 assert.deepEqual([...FARM_WATER_SUPPLY_ROUTE.at(-1)],[29,5,.8]);
 assert.ok(FARM_ELECTRICAL_ROUTE.every(Object.isFrozen));
 assert.ok(FARM_WATER_SUPPLY_ROUTE.every(Object.isFrozen));
});
