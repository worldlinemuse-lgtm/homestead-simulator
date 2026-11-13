import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {evaluateWaterPreset,evaluateWaterTimeToVolume} from "../src/water-preset-utility.mjs";
import {utilityCapability,assertUtilityRegistry} from "../src/utility-registry.mjs";

// SECONDARY-owned independent regressions for original-source semantics.
// Never clone hydraulic algorithms or modify the original vendor/source engine.
const realm=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,
 Error,Infinity,NaN,Uint8Array,Float64Array,Float32Array,Int32Array});
vm.runInContext(fs.readFileSync(new URL("../vendor/water-engine.js",import.meta.url),"utf8"),
 realm,{filename:"vendor/water-engine.js",timeout:30000});
const original=realm.HomesteadWaterCore;

test("source timeTo tolerance cannot claim a zero-output design meets a sub-centiliter target",()=>{
 // Original timeToGen uses produced >= requestedLiters - 0.01.
 // This test documents the source limitation; Homestead must not call that
 // tolerance a successful physical delivery of 0.001 or 0.01 liters.
 const dry=original.buildPreset("H");
 original.step(dry,300,1);
 assert.equal(dry.produced,0,"Unconnected upstream sandbox must have zero actual outlet production");
 for(const liters of [0.001,0.009,0.01]){
  const sourceAnswer=original.timeTo(original.buildPreset("H"),liters,1,24);
  assert.notEqual(sourceAnswer.min,null,
   "The original tolerance reproducer changed; reassess this boundary test");
  try{
   const result=evaluateWaterTimeToVolume(original,{preset:"H",liters,scenario:1});
   assert.equal(result.minutes,null,
    "False success: original source says target reached with zero actual outlet liters, target="+liters);
   assert.ok(typeof result.reason==="string"&&result.reason.trim(),
    "Unreachable target requires an actionable reason");
  }catch(error){
   // Rejecting a request below the source's physical resolution is also safe.
   // Do not allow arbitrary errors to silently satisfy this acceptance test.
   if(!(error instanceof RangeError||error instanceof TypeError)||
      !/target|volume|resolution|tolerance/i.test(error.message))throw error;
  }
 }
});

test("same-type upstream component reorder must reject incorrect source-key attribution",()=>{
 // Original source preset G contains two Mission filters with different keys
 // but the same type; positional type-only verification cannot distinguish them.
 const preset=original.PRESETS.G;
 const keys=Object.keys(preset.parts);
 const i=keys.indexOf("m1"),j=keys.indexOf("m2");
 assert.ok(i>=0&&j>=0&&i!==j);
 assert.equal(preset.parts.m1.type,preset.parts.m2.type);
 const reordered={...original,buildPreset(name){
  const w=original.buildPreset(name);
  if(name==="G") [w.parts[i],w.parts[j]]=[w.parts[j],w.parts[i]];
  return w;
 }};
 // Full hydraulic physics remain source-native: only component enumeration differs.
 assert.throws(()=>evaluateWaterPreset(reordered,{preset:"G",seconds:60,scenario:1}),
  /source.*(identity|order|key|mapping)|component.*(identity|order|key|mapping)/i,
  "Do not silently label source m2 as m1 when same-type construction order changes");
});

test("time-to-volume registry declares actual executable units, not copied preset outputs",()=>{
 assert.equal(assertUtilityRegistry(),true);
 const c=utilityCapability("water.preset.time-to-volume");
 assert.ok(c);
 assert.equal(c.entrypoint,"evaluateWaterTimeToVolume");
 assert.equal(c.inputUnits?.liters,"L");
 assert.equal(c.inputUnits?.scenario,"index");
 assert.equal(c.inputUnits?.preset,"source-key");
 assert.equal(c.outputUnits?.minutes,"min");
 assert.equal(c.inputUnits?.seconds,undefined,
  "Time-to-volume accepts target liters and scenario, not a duration input");
 for(const key of ["produced","spilled","drained","estimatedParts"]){
  assert.equal(c.outputUnits?.[key],undefined,
   "Time-to-volume returns no "+key+" field; do not advertise inherited outputs");
 }
 assert.equal(c.mutatesModel,false);
 assert.equal(c.advancesClock,false);
});
