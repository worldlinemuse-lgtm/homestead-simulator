// Independent failure-mode audit for the exact original Farm local-midnight
// snapshot contract. Numerical source biology is unchanged; this tests the
// wrapper's decision to accept/reject a specific raw source date in each TZ.
import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const probe=String.raw`const fs=require("node:fs"),vm=require("node:vm");
const ctx=vm.createContext({Date,self:{},importScripts:()=>{}});
vm.runInContext(fs.readFileSync("src/farm-study-worker.js","utf8"),ctx,{timeout:1000});
ctx.snapshotForTest={day:Number(process.env.TEST_DAY),date:process.env.TEST_DATE,
  counts:{n:16},daily:{eggs:0,waterGal:0,kWh:0}};
try{
 const row=vm.runInContext("measure(snapshotForTest)",ctx,{timeout:1000});
 process.stdout.write(JSON.stringify({ok:true,date:row.date}));
}catch(e){
 process.stdout.write(JSON.stringify({ok:false,error:String(e.message)}));
}`;
function evaluate(tz,day,sourceDate){
 return JSON.parse(execFileSync(process.execPath,["-e",probe],{
  cwd:root,encoding:"utf8",timeout:12000,
  env:{...process.env,TZ:tz,TEST_DAY:String(day),TEST_DATE:sourceDate}
 }));
}
test("source snapshot date identity is exact for the worker timezone, not any of two adjacent days",()=>{
 const cases=[
  {tz:"UTC",day:1,valid:"2026-11-05",forged:"2026-11-04"},
  {tz:"America/New_York",day:1,valid:"2026-11-05",forged:"2026-11-04"},
  {tz:"Asia/Tokyo",day:1,valid:"2026-11-04",forged:"2026-11-05"},
  {tz:"UTC",day:90,valid:"2027-02-02",forged:"2027-02-01"},
  {tz:"Asia/Tokyo",day:90,valid:"2027-02-01",forged:"2027-02-02"}
 ];
 for(const {tz,day,valid,forged} of cases){
  const accepted=evaluate(tz,day,valid);
  assert.equal(accepted.ok,true,JSON.stringify({tz,day,valid,accepted}));
  assert.equal(accepted.date,new Date(Date.UTC(2026,10,4+day)).toISOString().slice(0,10),
   "normalized Farm civil date must not shift with timezone");
  const rejected=evaluate(tz,day,forged);
  assert.equal(rejected.ok,false,
   "forged source date "+forged+" must be rejected for day "+day+" under "+tz);
  assert.match(rejected.error,/date|source|snapshot/i);
 }
});
