import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {farmStudyRequest,verifyFarmStudyResult,FARM_STUDY_SOURCE,FARM_STUDY_FIELDS}
 from "../src/farm-native-study.mjs";
const root=new URL("../",import.meta.url);
const core=fs.readFileSync(new URL("vendor/farm-core.js",root),"utf8");
const workerSource=fs.readFileSync(new URL("src/farm-study-worker.js",root),"utf8");
function farmContext(){
 const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,
  Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,
  performance:{now:()=>0}});
 vm.runInContext(core,ctx,{filename:"vendor/farm-core.js",timeout:30000});
 return ctx;
}
function workerContext(){
 const ctx=farmContext();
 ctx.self=ctx;
 ctx.messages=[];
 ctx.postMessage=value=>ctx.messages.push(JSON.parse(JSON.stringify(value)));
 ctx.importScripts=filename=>{
  assert.equal(filename,"../vendor/farm-core.js");
  // The worker must create its own Farm closure, never use the live one.
  vm.runInContext(core,ctx,{filename:"worker-vendor/farm-core.js",timeout:30000});
 };
 vm.runInContext(workerSource,ctx,{filename:"src/farm-study-worker.js",timeout:30000});
 return ctx;
}
const values={mg_does:6,mg_hens:12,mg_roosters:1,mg_set:5};
test("source Farm controls have identical keys/defaults/units to original settings.js",()=>{
 assert.deepEqual(FARM_STUDY_FIELDS.map(f=>[f.key,f.default,f.unit]),[
  ["mg_does",6,"does"],["mg_hens",12,"hens"],
  ["mg_roosters",1,"birds"],["mg_set",5,"eggs/wk"]]);
 assert.equal(FARM_STUDY_SOURCE.revision,"d6614d7981535fa2b74be86e0c5356af57b56e3b");
});
test("native worker's 7-day biological trajectory matches separate direct original Farm step-for-step",()=>{
 const request=farmStudyRequest({days:7,seed:7,parameters:values});
 const isolated=workerContext(),reference=farmContext();
 isolated.self.onmessage({data:request});
 assert.equal(isolated.messages.length,1);
 const reply=isolated.messages[0];
 assert.equal(reply.ok,true,JSON.stringify(reply));
 const study=verifyFarmStudyResult(reply.result,request);
 assert.equal(study.initial.day,0);
 const direct=reference.HomesteadFarmCore;
 direct.reset(request.seed);
 for(const [k,v] of Object.entries(request.parameters))direct.setParameter(k,v);
 direct.reset(request.seed);
 for(const item of study.series){
  const snap=direct.advanceDay();
  assert.equal(item.day,snap.day);
  assert.equal(item.date,snap.date);
  assert.equal(item.animals,snap.counts.n);
  assert.equal(item.eggs,snap.daily.eggs??0);
  assert.equal(item.waterGal,snap.daily.waterGal);
  assert.equal(item.electricityKWh,snap.daily.kWh);
 }
 assert.equal(study.final.day,7);
});
test("fresh worker produces deterministic but isolated changed management scenarios",()=>{
 const request=farmStudyRequest({days:30,seed:914,parameters:{
  mg_does:4,mg_hens:18,mg_roosters:1,mg_set:3}});
 const run=()=>{const w=workerContext();w.self.onmessage({data:request});return w.messages[0]};
 const baseline=run(),again=run();
 assert.equal(baseline.ok,true,JSON.stringify(baseline));
 assert.deepEqual(baseline,again,"original seeded biology must replay exactly");
 const study=verifyFarmStudyResult(baseline.result,request);
 assert.equal(study.series.length,30);
 assert.ok(study.totals.waterGal>=0);
 assert.ok(study.totals.electricityKWh>=0);
 assert.ok(study.totals.eggs>=0);
});
test("a Farm study cannot advance or change the connected Farm closure",()=>{
 const live=farmContext().HomesteadFarmCore;
 live.reset(7);
 const baseline=JSON.stringify(live.snapshot());
 const req=farmStudyRequest({days:7,seed:7,parameters:values});
 const independent=workerContext();independent.self.onmessage({data:req});
 assert.equal(independent.messages[0].ok,true);
 assert.equal(JSON.stringify(live.snapshot()),baseline);
});
test("worker fail-closed on forged source params, invalid seeds and horizons",()=>{
 const worker=workerContext();
 for(const bad of [
  {...farmStudyRequest(),seed:NaN},
  {...farmStudyRequest(),days:10},
  {...farmStudyRequest(),parameters:{...values,mg_hens:"20"}},
  {...farmStudyRequest(),parameters:{...values,unknown:1}},
  {...farmStudyRequest(),parameters:{...values,mg_does:-1}},
  {...farmStudyRequest(),parameters:{"__proto__":1,...values,mg_does:21}},
  {...farmStudyRequest(),schema:2},
  null,[],{schema:1}
 ]){
  worker.self.onmessage({data:bad});
  const reply=worker.messages.at(-1);
  assert.equal(reply.ok,false,JSON.stringify(bad));
  assert.ok(typeof reply.error==="string"&&reply.error.length>0);
 }
 assert.throws(()=>farmStudyRequest({parameters:{mg_hens:Infinity}}),/integer/);
 assert.throws(()=>farmStudyRequest({parameters:{mg_roosters:2.2}}),/integer/);
 assert.throws(()=>farmStudyRequest({seed:4294967296}),/integer/);
});
test("client rejects forged provenance, chronology, missing native fields and conservation errors",()=>{
 const req=farmStudyRequest();
 const worker=workerContext();worker.self.onmessage({data:req});
 const valid=worker.messages[0].result;
 const copy=()=>JSON.parse(JSON.stringify(valid));
 for(const mutate of [
  x=>{x.source.revision="forged";},
  x=>{x.series[1].date=x.series[0].date;},
  x=>{x.series[3].electricityKWh=NaN;},
  x=>{x.series[3].waterGal=-1;},
  x=>{x.totals.eggs+=1;},
  x=>{x.parameters.mg_does=99;},
  x=>{x.series.pop();},
  x=>{x.initial.day=1;},
  x=>{x.initial.day=-1;},
  x=>{x.final.day=999;}
 ]){
  const forged=copy();mutate(forged);
  assert.throws(()=>verifyFarmStudyResult(forged,req),/Farm|source|original|Invalid/);
 }
});