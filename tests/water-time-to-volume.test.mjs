import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {evaluateWaterTimeToVolume,waterPresetNativeControls} from "../src/water-preset-utility.mjs";
import {assertUtilityRegistry,utilityCapability} from "../src/utility-registry.mjs";
const context=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,Infinity,NaN});
vm.runInContext(fs.readFileSync(new URL("../vendor/water-engine.js",import.meta.url),"utf8"),context,{timeout:30000});
const engine=context.HomesteadWaterCore;
test("original source timeTo is exposed unchanged and registry route is executable",()=>{
 assert.equal(typeof engine.timeTo,"function");
 assert.equal(typeof engine.timeToGen,"function");
 assert.equal(assertUtilityRegistry(),true);
 const capability=utilityCapability("water.preset.time-to-volume");
 assert.equal(capability.entrypoint,"evaluateWaterTimeToVolume");
 assert.equal(capability.ui,"waterTimeRun");
 assert.match(fs.readFileSync(new URL("../index.html",import.meta.url),"utf8"),/id="waterTimeRun"/);
 assert.match(fs.readFileSync(new URL("../src/main.js",import.meta.url),"utf8"),/evaluateWaterTimeToVolume\(window.HomesteadWaterCore/);
});
test("time-to-volume parity with the original source engine for multiple scenarios",()=>{
 for(const preset of ["A","E","H"])for(const scenario of [0,1,2]){
  const direct=engine.timeTo(engine.buildPreset(preset),10,scenario,24);
  const actual=evaluateWaterTimeToVolume(engine,{preset,liters:10,scenario});
  assert.equal(actual.minutes,direct.min);
  assert.equal(actual.reason,direct.min===null?direct.why:null);
  assert.equal(actual.solverSteps,direct.steps);
  assert.equal(actual.maxHours,24);
 }
});
test("native pump and RO input edits preserve direct source parity",()=>{
 const controls=waterPresetNativeControls(engine,"E");
 const edits=controls.filter(c=>c.field==="psi"||c.field==="drain")
  .map(c=>({key:c.key,field:c.field,value:c.field==="psi"?65:2}));
 assert.equal(edits.length,2);
 const world=engine.buildPreset("E");
 const keys=Object.keys(engine.PRESETS.E.parts);
 for(const e of edits)world.parts[keys.indexOf(e.key)].params[e.field]=e.value;
 const direct=engine.timeTo(world,15,1,24);
 const actual=evaluateWaterTimeToVolume(engine,{preset:"E",liters:15,scenario:1,componentEdits:edits});
 assert.equal(actual.minutes,direct.min);
 assert.equal(actual.reason,direct.min===null?direct.why:null);
});
test("replay deterministic and isolated from an active world",()=>{
 const live=engine.buildPreset("E"),before=JSON.stringify(live);
 const a=evaluateWaterTimeToVolume(engine,{preset:"E",liters:10});
 const b=evaluateWaterTimeToVolume(engine,{preset:"E",liters:10});
 assert.deepEqual(a,b);
 assert.equal(JSON.stringify(live),before);
 assert.ok(Object.isFrozen(a));
});
test("invalid volumes, forged identities and scenarios fail closed",()=>{
 for(const liters of [0,-1,NaN,Infinity,-Infinity,10001,"10",null,{}])
  assert.throws(()=>evaluateWaterTimeToVolume(engine,{liters}),/Target volume/);
 for(const scenario of [-1,3,NaN,"1",null])
  assert.throws(()=>evaluateWaterTimeToVolume(engine,{scenario}),/Water source scenario/);
 for(const preset of ["","Z","__proto__",null])
  assert.throws(()=>evaluateWaterTimeToVolume(engine,{preset}),/Original Water preset engine/);
 assert.throws(()=>evaluateWaterTimeToVolume(engine,{componentEdits:[{key:"forged",field:"psi",value:10}]}),/Unknown Water source/);
 assert.throws(()=>evaluateWaterTimeToVolume({},{}),/Original Water timeTo/);
});

test("native unreachable diagnostics are nonblank and source ETA respects 24-hour horizon",()=>{
 const live=engine.buildPreset("E"),before=JSON.stringify(live);
 for(const output of [
  {min:null,steps:1,why:""},
  {min:null,steps:1,why:" \t \n "},
  {min:null,steps:1,why:0},
  {min:null,steps:1,why:undefined},
  {min:1440.0001,steps:7},
  {min:Infinity,steps:7},
  {min:-0.1,steps:7}
 ]){
  let calls=0;
  const mocked={...engine,timeTo(){calls++;return output;}};
  assert.throws(()=>evaluateWaterTimeToVolume(mocked,{preset:"E",liters:10,scenario:1}),
   /Original Water time-to-volume result is invalid/,
   "Malformed native source result must never become an authoritative ETA");
  assert.equal(calls,1,"Each valid study runs exactly one source solver");
  assert.equal(JSON.stringify(live),before,"Bad results cannot mutate external live world");
 }
 for(const output of [
  {min:null,steps:1,why:"No outlet flow"},
  {min:1440,steps:12}
 ]){
  const mocked={...engine,timeTo(){return output;}};
  const value=evaluateWaterTimeToVolume(mocked,{preset:"E",liters:10,scenario:1});
  assert.equal(value.minutes,output.min);
  assert.equal(value.reason,output.min===null?output.why:null);
  assert.equal(value.maxHours,24);
 }
});
