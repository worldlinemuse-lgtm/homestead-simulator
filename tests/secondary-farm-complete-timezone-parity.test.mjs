// SECONDARY: complete original-Farm-worker versus source-core run under actual TZ
// subprocesses. Checks biological parity at EVERY day, unchanged original source
// date serialization, timezone-independent civil output and deterministic replay.
// No duplicated source biology or PRIMARY-owned implementation changes.
import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const cwd=fileURLToPath(new URL("../",import.meta.url));
const child=String.raw`import fs from "node:fs";
import vm from "node:vm";
import {farmStudyRequest,verifyFarmStudyResult} from "./src/farm-native-study.mjs";
const request=farmStudyRequest(JSON.parse(process.env.FARM_TEST_REQUEST));
const vendor=fs.readFileSync("vendor/farm-core.js","utf8");
const workerCode=fs.readFileSync("src/farm-study-worker.js","utf8");
const fields={console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,
 Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,
 performance:{now:()=>0}};
const fresh=()=>vm.createContext({...fields});
const worker=fresh(),reply=[];
worker.self=worker;
worker.importScripts=(file)=>{
 if(file!=="../vendor/farm-core.js")throw Error("Worker imported unexpected script: "+file);
 vm.runInContext(vendor,worker,{filename:"vendor/farm-core.js",timeout:10000});
};
worker.postMessage=message=>reply.push(JSON.parse(JSON.stringify(message)));
vm.runInContext(workerCode,worker,{filename:"src/farm-study-worker.js",timeout:10000});
worker.self.onmessage({data:request});
if(reply.length!==1||reply[0].ok!==true){
 process.stdout.write(JSON.stringify({error:reply}));
 process.exit(0);
}
const result=verifyFarmStudyResult(reply[0].result,request);
const native=fresh();
vm.runInContext(vendor,native,{filename:"vendor/farm-core.js",timeout:10000});
const original=native.HomesteadFarmCore;
original.reset(request.seed);
for(const [key,value] of Object.entries(request.parameters)) original.setParameter(key,value);
original.reset(request.seed);
const initial=original.snapshot(),series=[];
for(let day=0;day<request.days;day++)series.push(original.advanceDay());
process.stdout.write(JSON.stringify({source:result.source,initial:result.initial,
 series:result.series,final:result.final,totals:result.totals,
 params:result.parameters,seed:result.seed,days:result.days,
 originalInitial:{day:initial.day,date:initial.date,n:initial.counts.n},
 originalSeries:series.map(s=>({day:s.day,date:s.date,n:s.counts.n,
  eggs:s.daily.eggs??0,waterGal:s.daily.waterGal,kWh:s.daily.kWh}))}));`;
function execute(tz,request){
 return JSON.parse(execFileSync(process.execPath,["--input-type=module","--eval",child],{
  cwd,env:{...process.env,TZ:tz,FARM_TEST_REQUEST:JSON.stringify(request)},
  encoding:"utf8",maxBuffer:3*1024*1024,timeout:30000
 }));
}
function verifyNativeDaily(caseLabel,result){
 assert.equal(result.error,undefined,caseLabel+" worker did not complete");
 assert.equal(result.initial.day,0);
 assert.equal(result.initial.eggs,null,"day-zero eggs are not measured");
 assert.equal(result.initial.waterGal,null,"day-zero water is not measured");
 assert.equal(result.initial.electricityKWh,null,"day-zero electricity is not measured");
 assert.equal(result.initial.animals,result.originalInitial.n);
 assert.equal(result.originalInitial.day,0);
 assert.equal(result.initial.date,"2026-11-04","normalized civil epoch");
 assert.equal(result.series.length,result.days);
 const sum={eggs:0,waterGal:0,electricityKWh:0};
 for(let i=0;i<result.days;i++){
  const row=result.series[i],raw=result.originalSeries[i];
  const civil=new Date(Date.UTC(2026,10,5+i)).toISOString().slice(0,10);
  assert.equal(row.day,i+1,caseLabel+" day index "+i);
  assert.equal(raw.day,row.day);
  assert.equal(row.date,civil,caseLabel+" civil day "+i);
  assert.equal(row.animals,raw.n,caseLabel+" native animal count "+i);
  assert.equal(row.eggs,raw.eggs,caseLabel+" native eggs "+i);
  assert.equal(row.waterGal,raw.waterGal,caseLabel+" native US gallons "+i);
  assert.equal(row.electricityKWh,raw.kWh,caseLabel+" native kWh "+i);
  sum.eggs+=row.eggs;sum.waterGal+=row.waterGal;sum.electricityKWh+=row.electricityKWh;
 }
 assert.deepEqual(result.final,result.series.at(-1));
 for(const k of Object.keys(sum))
  assert.ok(Math.abs(sum[k]-result.totals[k])<=1e-8*Math.max(1,sum[k]),
   caseLabel+" source resource conservation "+k);
}
const baseline={schema:1,seed:193847,days:90,
 parameters:{mg_does:9,mg_hens:18,mg_roosters:2,mg_set:12}};
test("90 daily original-core biology and units agree across UTC, New York, Tokyo and Chatham",()=>{
 const zones=["UTC","America/New_York","Asia/Tokyo","Pacific/Chatham"];
 const samples=zones.map(tz=>[tz,execute(tz,baseline)]);
 for(const [tz,data] of samples)verifyNativeDaily(tz,data);
 const canonical=samples[0][1];
 for(const [tz,data] of samples.slice(1)){
  for(const key of ["source","initial","series","final","totals","params","seed","days"])
   assert.deepEqual(data[key],canonical[key],tz+" timezone must not change "+key);
  if(tz==="Asia/Tokyo"||tz==="Pacific/Chatham")
   assert.notDeepEqual(data.originalSeries.map(s=>s.date),
    canonical.originalSeries.map(s=>s.date),
    tz+" raw local-midnight serialization must differ from UTC");
 }
 const replay=execute("Asia/Tokyo",baseline);
 assert.deepEqual(replay,samples[2][1],"repeated full-worker study must replay identically");
});
test("native Farm original worker supports 7/30 days, zero settings, max seed and max management",()=>{
 for(const request of [
  {schema:1,seed:0,days:7,
   parameters:{mg_does:0,mg_hens:0,mg_roosters:0,mg_set:0}},
  {schema:1,seed:4294967295,days:30,
   parameters:{mg_does:20,mg_hens:60,mg_roosters:10,mg_set:25}}
 ]){
  const eastern=execute("America/New_York",request);
  verifyNativeDaily("boundary",eastern);
  const utc=execute("UTC",request);
  verifyNativeDaily("boundary UTC",utc);
  for(const key of ["source","initial","series","final","totals","params","seed","days"])
   assert.deepEqual(eastern[key],utc[key],"native boundary parity "+key);
 }
});
