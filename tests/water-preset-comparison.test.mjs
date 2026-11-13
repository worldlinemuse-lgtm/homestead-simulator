import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
 evaluateWaterPreset,evaluateWaterPresetComparison,
 WATER_SOURCE_PRESET_IDS,WATER_PRESET_SOURCE
} from "../src/water-preset-utility.mjs";

function originalEngine(){
 const context=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,
  Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN});
 vm.runInContext(fs.readFileSync(new URL("../vendor/water-engine.js",import.meta.url),"utf8"),
  context,{filename:"vendor/water-engine.js",timeout:30000});
 return context.HomesteadWaterCore;
}
test("native Water comparison enumerates the eight actual source designs in stable source-key order",()=>{
 const engine=originalEngine();
 const report=evaluateWaterPresetComparison(engine,{seconds:60,scenario:1});
 assert.deepEqual([...WATER_SOURCE_PRESET_IDS],["A","B","C","D","E","F","G","H"]);
 assert.deepEqual(report.results.map(r=>r.preset),[...WATER_SOURCE_PRESET_IDS]);
 assert.equal(report.results.length,8);
 assert.equal(report.source,WATER_PRESET_SOURCE);
 assert.equal(report.schema,1);
 assert.equal(report.seconds,60);
 assert.equal(report.scenario,1);
 assert.ok(Object.isFrozen(report));
 assert.ok(Object.isFrozen(report.results));
 for(const row of report.results){
  assert.ok(Object.isFrozen(row));
  assert.ok(Object.isFrozen(row.warnings));
  assert.equal(row.name,engine.PRESETS[row.preset].name);
  for(const key of ["producedL","spilledL","drainedL","divertedL","estimatedPartsUSD"]){
   assert.ok(Number.isFinite(row[key])&&row[key]>=0,row.preset+": "+key);
  }
 }
});
test("all eight comparison rows equal independent original-source evaluations, no duplicate physics",()=>{
 const engine=originalEngine();
 for(const scenario of [0,1,2]){
  const comparison=evaluateWaterPresetComparison(engine,{seconds:300,scenario});
  comparison.results.forEach((row,i)=>{
   const standalone=evaluateWaterPreset(engine,{preset:WATER_SOURCE_PRESET_IDS[i],seconds:300,scenario});
   assert.deepEqual(row,standalone);
  });
 }
});
test("comparisons are deterministic, isolate all source worlds and do not change running world",()=>{
 const engine=originalEngine();
 const live=engine.buildPreset("E");
 const before=JSON.stringify(live);
 const first=evaluateWaterPresetComparison(engine,{seconds:900,scenario:2});
 const second=evaluateWaterPresetComparison(engine,{seconds:900,scenario:2});
 assert.deepEqual(first,second);
 assert.equal(JSON.stringify(live),before);
});
test("invalid inputs and missing native design fail before executing any solver",()=>{
 const engine=originalEngine();
 let buildCount=0;
 const instrumented={...engine,buildPreset:(...args)=>{buildCount++;return engine.buildPreset(...args)}};
 for(const seconds of [0,-1,1,120,3600,NaN,Infinity,"60",null,{}])
  assert.throws(()=>evaluateWaterPresetComparison(instrumented,{seconds}),/duration/);
 for(const scenario of [-1,3,1.5,NaN,Infinity,"1",null])
  assert.throws(()=>evaluateWaterPresetComparison(instrumented,{scenario}),/scenario/);
 assert.equal(buildCount,0);
 const incomplete={...instrumented,PRESETS:{...engine.PRESETS}};
 delete incomplete.PRESETS.H;
 assert.throws(()=>evaluateWaterPresetComparison(incomplete),/all eight source designs/);
 assert.equal(buildCount,0);
 assert.throws(()=>evaluateWaterPresetComparison(null),/all eight source designs/);
});
test("comparison source results never imply safety if the source records no outlet flow",()=>{
 const report=evaluateWaterPresetComparison(originalEngine(),{seconds:60,scenario:1});
 const sandbox=report.results.find(r=>r.preset==="H");
 assert.equal(sandbox.producedL,0);
 assert.ok(sandbox.treatmentGaps.length>0);
 assert.match(report.assumptions,/Not a certified field yield/);
});
