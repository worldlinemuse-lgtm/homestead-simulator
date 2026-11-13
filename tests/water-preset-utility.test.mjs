import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {evaluateWaterPreset,WATER_PRESET_SOURCE} from "../src/water-preset-utility.mjs";
const context=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,
 Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN});
vm.runInContext(fs.readFileSync(new URL("../vendor/water-engine.js",import.meta.url),"utf8"),context,
 {filename:"vendor/water-engine.js",timeout:30000});
const engine=context.HomesteadWaterCore;
test("Water preset evaluator delegates to actual vendored source engine and retains provenance",()=>{
 const result=evaluateWaterPreset(engine,{preset:"E",seconds:60,scenario:1});
 assert.equal(result.schema,1);
 assert.equal(result.preset,"E");
 assert.equal(result.seconds,60);
 assert.equal(result.source.commit,"bd1bfedc8e53d71792f532c5a89d80a33dcf6700");
 assert.equal(result.source.path,"source/engine.js");
 assert.equal(result.source.sourceBlob,WATER_PRESET_SOURCE.sourceBlob);
 const raw=engine.buildPreset("E"),study=engine.analyze(raw);
 let elapsed=0;
 while(elapsed<60){const r=engine.step(raw,Math.min(60,60-elapsed),1);elapsed+=r.dt;}
 assert.ok(Math.abs(raw.produced-result.producedL)<1e-8);
 assert.ok(Math.abs(raw.spilled-result.spilledL)<1e-8);
 assert.ok(Math.abs(raw.drained-result.drainedL)<1e-8);
 assert.equal(result.estimatedPartsUSD,study.cost);
 assert.equal(result.safetyScreen,study.safety.title);
 assert.ok(Array.isArray(result.warnings));
});
test("repeated source previews are deterministic and cannot mutate an existing live world",()=>{
 const active=engine.buildPreset("E");
 const frozen=JSON.stringify(active);
 const first=evaluateWaterPreset(engine,{preset:"E",seconds:300,scenario:1});
 const second=evaluateWaterPreset(engine,{preset:"E",seconds:300,scenario:1});
 assert.deepEqual(first,second);
 assert.equal(JSON.stringify(active),frozen);
 assert.ok(Object.isFrozen(first));
 assert.ok(Object.isFrozen(first.warnings));
});
test("source preset cases with no outlet flow retain honest zero output, no invented yield",()=>{
 for(const preset of ["A","B","C","D","E","F","G","H"]){
  const r=evaluateWaterPreset(engine,{preset,seconds:60,scenario:1});
  for(const name of ["producedL","spilledL","drainedL","divertedL","estimatedPartsUSD"])
   assert.ok(Number.isFinite(r[name])&&r[name]>=0,preset+" "+name);
  assert.equal(r.seconds,60);
 }
 const empty=evaluateWaterPreset(engine,{preset:"H",seconds:60,scenario:1});
 assert.equal(empty.producedL,0);
 assert.ok(empty.treatmentGaps.length>0);
});
test("Water preview rejects invalid requests before invoking the engine",()=>{
 for(const preset of ["",null,"Z","__proto__",7]){
  assert.throws(()=>evaluateWaterPreset(engine,{preset}),/Unsupported Water source preset/);
 }
 for(const seconds of [0,-1,NaN,Infinity,1,3600,"60",null,{}]){
  assert.throws(()=>evaluateWaterPreset(engine,{seconds}),/Water preview duration/);
 }
 for(const scenario of [-1,3,1.5,"1",NaN,Infinity,null]){
  assert.throws(()=>evaluateWaterPreset(engine,{scenario}),/Water source scenario/);
 }
 assert.throws(()=>evaluateWaterPreset({},{}),/Original Water engine/);
});
test("low, baseline and high source solver scenarios are finite and isolated",()=>{
 for(const scenario of [0,1,2]){
  const r=evaluateWaterPreset(engine,{preset:"E",seconds:900,scenario});
  assert.equal(r.scenario,scenario);
  assert.ok(r.producedL>=0);
  assert.equal(r.seconds,900);
 }
});
