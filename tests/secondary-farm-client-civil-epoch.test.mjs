// SECONDARY validator security contract: the Farm worker output must be
// pinned to the original core's known civil epoch, not just internally regular.
// This test uses an actual native worker result; no mock of the Farm biology.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {farmStudyRequest,verifyFarmStudyResult} from "../src/farm-native-study.mjs";
const worker=fs.readFileSync(new URL("../src/farm-study-worker.js",import.meta.url),"utf8");
const vendor=fs.readFileSync(new URL("../vendor/farm-core.js",import.meta.url),"utf8");
function validResponse(days=7){
 const req=farmStudyRequest({seed:79,days,parameters:{
  mg_does:7,mg_hens:11,mg_roosters:1,mg_set:6}});
 const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,
  JSON,Error,Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,
  performance:{now:()=>0}});
 const messages=[];ctx.self=ctx;
 ctx.importScripts=path=>{
  assert.equal(path,"../vendor/farm-core.js");
  vm.runInContext(vendor,ctx,{timeout:15000});
 };
 ctx.postMessage=x=>messages.push(JSON.parse(JSON.stringify(x)));
 vm.runInContext(worker,ctx,{timeout:15000});
 ctx.self.onmessage({data:req});
 assert.equal(messages.length,1);
 assert.equal(messages[0].ok,true,JSON.stringify(messages[0]));
 assert.equal(verifyFarmStudyResult(messages[0].result,req),messages[0].result);
 return {req,result:messages[0].result};
}
function moveDate(date,days){
 return new Date(Date.parse(date+"T00:00:00Z")+days*86400000).toISOString().slice(0,10);
}
test("forged uniformly shifted civil calendar must not pass pinned original Farm identity",()=>{
 for(const days of [7,30]){
  const {req,result}=validResponse(days);
  assert.equal(result.initial.date,"2026-11-04");
  for(const offset of [-365,-1,1,365]){
   const fake=structuredClone(result);
   fake.initial.date=moveDate(fake.initial.date,offset);
   fake.series.forEach(row=>row.date=moveDate(row.date,offset));
   fake.final.date=moveDate(fake.final.date,offset);
   // The fake remains internally consecutive and conservation-preserving.
   assert.equal(fake.series[0].date,moveDate(fake.initial.date,1));
   assert.throws(()=>verifyFarmStudyResult(fake,req),
    /date|calendar|chronology|original|Farm/i,
    "validator accepted altered civil start at offset "+offset+" and horizon "+days);
  }
 }
});
test("original Farm client rejects malformed provenance, nonfinite values and absent ledgers",()=>{
 const {req,result}=validResponse();
 const malicious=[
  x=>{x.source.repository=" "},
  x=>{x.source.revision="0000000000000000000000000000000000000000"},
  x=>{x.source.path="other/core.js"},
  x=>{x.source.unexpected="x"},
  x=>{x.source=[]},
  x=>{delete x.source.repository},
  x=>{x.series[0].waterGal=Infinity},
  x=>{x.series[0].eggs=NaN},
  x=>{x.series[0].electricityKWh=-1},
  x=>{x.series[0].animals="12"},
  x=>{x.initial.eggs=0},
  x=>{x.series[0].date="2026-02-30"},
  x=>{x.series[0].day=3},
  x=>{x.final.eggs=9999},
  x=>{x.totals.waterGal=0},
  x=>{x.limitations[0]="   "},
  x=>{x.parameters.mg_hens=12}
 ];
 for(const [i,mutate] of malicious.entries()){
  const altered=structuredClone(result);
  mutate(altered);
  assert.throws(()=>verifyFarmStudyResult(altered,req),undefined,
   "invalid native worker response accepted at mutation index "+i);
 }
 assert.equal(verifyFarmStudyResult(result,req),result,"untampered native response accepted");
});
