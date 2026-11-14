// Independent secondary QA for original Farm worker biological parity, provenance
// and calendar semantics. No production engine, adapter, or primary file modified.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {farmStudyRequest,verifyFarmStudyResult}
 from "../src/farm-native-study.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
const vendor=fs.readFileSync(path.join(root,"vendor/farm-core.js"),"utf8");
const workerCode=fs.readFileSync(path.join(root,"src/farm-study-worker.js"),"utf8");
const controls={mg_does:6,mg_hens:12,mg_roosters:1,mg_set:5};
function context(){
 const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,
  Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,
  performance:{now:()=>0}});
 vm.runInContext(vendor,ctx,{filename:"vendor/farm-core.js",timeout:30000});
 return ctx;
}
function workerResult(request,onImport=()=>{}){
 const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,
  Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,
  performance:{now:()=>0}});
 const responses=[];
 ctx.self=ctx;
 ctx.importScripts=name=>{
  assert.equal(name,"../vendor/farm-core.js");
  vm.runInContext(vendor,ctx,{filename:"worker/vendor/farm-core.js",timeout:30000});
  onImport(ctx);
 };
 ctx.postMessage=data=>responses.push(JSON.parse(JSON.stringify(data)));
 vm.runInContext(workerCode,ctx,{filename:"src/farm-study-worker.js",timeout:30000});
 ctx.self.onmessage({data:request});
 assert.equal(responses.length,1,"worker must reply exactly once");
 assert.equal(responses[0].ok,true,JSON.stringify(responses[0]));
 return verifyFarmStudyResult(responses[0].result,request);
}
test("90-day Farm worker output matches every original daily biological step and resource, not merely summary totals",()=>{
 const request=farmStudyRequest({seed:193847,days:90,parameters:{
  mg_does:9,mg_hens:18,mg_roosters:2,mg_set:12}});
 const study=workerResult(request),native=context().HomesteadFarmCore;
 native.reset(request.seed);
 for(const [key,value] of Object.entries(request.parameters))native.setParameter(key,value);
 native.reset(request.seed);
 const initial=native.snapshot();
 assert.equal(study.initial.day,initial.day);
 assert.equal(study.initial.date,"2026-11-04");
 assert.ok(["2026-11-03","2026-11-04"].includes(initial.date),
  "original local-midnight ISO date may be one civil day earlier");
 assert.equal(study.initial.animals,initial.counts.n);
 for(let i=0;i<90;i++){
  const snapshot=native.advanceDay(),row=study.series[i];
  assert.equal(row.day,snapshot.day,"day "+(i+1));
  const civilDate=new Date(Date.UTC(2026,10,4+i+1)).toISOString().slice(0,10);
  const priorDate=new Date(Date.UTC(2026,10,4+i)).toISOString().slice(0,10);
  assert.equal(row.date,civilDate,"normalized source civil date "+(i+1));
  assert.ok([civilDate,priorDate].includes(snapshot.date),
   "original local-midnight ISO serialization day "+(i+1));
  assert.equal(row.animals,snapshot.counts.n,"animals day "+(i+1));
  assert.equal(row.eggs,snapshot.daily.eggs??0,"eggs day "+(i+1));
  assert.equal(row.waterGal,snapshot.daily.waterGal,"US gallons day "+(i+1));
  assert.equal(row.electricityKWh,snapshot.daily.kWh,"kilowatt hours day "+(i+1));
 }
 assert.deepEqual(study.series.at(-1),study.final);
 assert.deepEqual(study,workerResult(request),"same seed and parameters must replay");
});
test("native incubator control is passed unmodified to the original Farm engine; winter response is conditional",()=>{
 const request=farmStudyRequest({days:90,seed:7,parameters:{...controls,mg_set:25}});
 const calls=[];
 const changed=workerResult(request,ctx=>{
  const native=ctx.HomesteadFarmCore;
  ctx.HomesteadFarmCore={...native,setParameter(key,value){
   calls.push([key,value]);
   return native.setParameter(key,value);
  }};
 });
 assert.deepEqual(calls,Object.entries(request.parameters),
  "all four source-native management settings must reach setParameter with exact values");
 const baseline=workerResult(farmStudyRequest({days:90,seed:7,
  parameters:{...controls,mg_set:0}}));
 assert.equal(changed.parameters.mg_set,25);
 assert.equal(baseline.parameters.mg_set,0);
 // Source weather/laying/hatching and maturation determine whether a management
 // target changes animal counts within 90 winter days. No sensitivity claim
 // should be made from an input change alone without a source diagnostic.
 assert.deepEqual(changed.series.map(s=>s.animals),baseline.series.map(s=>s.animals),
  "pinned winter seed shows same reported animal counts despite different setting");
});
test("reject a forged source repository even when revision and path look authentic",()=>{
 const request=farmStudyRequest();
 const valid=workerResult(request);
 const forged=structuredClone(valid);
 forged.source.repository="attacker/unaudited-farm";
 assert.throws(()=>verifyFarmStudyResult(forged,request),
  /source|provenance|repository|original/i,
  "revision and path alone cannot authenticate repository identity");
});
test("Farm daily scenario calendar dates do not change with host browser timezone",()=>{
 // Source model starts on 2026-11-04 (core/state.js). Its Date is constructed
 // in local time, but snapshot serializes UTC with toISOString(). The adapter
 // must return a timezone-invariant civil model date while preserving biology.
 const script=`
  const fs=require("node:fs"),vm=require("node:vm");
  const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,
   JSON,Error,Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,
   performance:{now:()=>0}});
  ctx.self=ctx;
  ctx.importScripts=()=>vm.runInContext(fs.readFileSync("vendor/farm-core.js","utf8"),ctx,{timeout:30000});
  ctx.postMessage=message=>process.stdout.write(JSON.stringify({
   ok:message.ok,error:message.error,initial:message.result?.initial.date,
   first:message.result?.series[0]?.date,final:message.result?.final.date
  }));
  vm.runInContext(fs.readFileSync("src/farm-study-worker.js","utf8"),ctx,{timeout:30000});
  ctx.self.onmessage({data:{schema:1,seed:7,days:7,
   parameters:{mg_does:6,mg_hens:12,mg_roosters:1,mg_set:5}}});
 `;
 const probe=tz=>JSON.parse(execFileSync(process.execPath,["-e",script],{
  cwd:root,env:{...process.env,TZ:tz},encoding:"utf8",timeout:35000
 }));
 const eastern=probe("America/New_York"),tokyo=probe("Asia/Tokyo"),utc=probe("UTC");
 assert.equal(eastern.ok,true,JSON.stringify(eastern));
 assert.equal(tokyo.ok,true,JSON.stringify(tokyo));
 assert.equal(utc.ok,true,JSON.stringify(utc));
 assert.equal(eastern.initial,"2026-11-04","original source civil day zero");
 assert.deepEqual(tokyo,eastern,
  "date-only native Farm results should not vary with client timezone");
 assert.deepEqual(utc,eastern,
  "date-only native Farm results should not vary with client timezone");
});
