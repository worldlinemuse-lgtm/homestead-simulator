import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {createHash} from "node:crypto";
import {evaluateNativeSolarBattery,evaluateNativeSolarAgmSweep,SOLAR_BATTERY_SOURCE} from "../src/solar-battery-utility.mjs";
const code=fs.readFileSync(new URL("../vendor/solar-battery-native.js",import.meta.url),"utf8");
const blob=createHash("sha1").update("blob "+Buffer.byteLength(code)+"\0"+code).digest("hex");
const ctx={module:{exports:{}},window:undefined};
vm.runInNewContext(code,ctx,{filename:"source/battery.js",timeout:30000});
const native=ctx.module.exports;
test("vendored original Solar battery source is byte-identical to pinned upstream blob",()=>{
 assert.equal(blob,"d3190721347fc53991a5d1c7b535dd658c46696f");
 assert.equal(SOLAR_BATTERY_SOURCE.blob,blob);
 assert.equal(SOLAR_BATTERY_SOURCE.path,"source/battery.js");
 assert.equal(SOLAR_BATTERY_SOURCE.revision,"871dd8c0ef03a05feb339c9761ead900875f16b5");
 assert.equal(typeof native.drainMult,"function");
});
test("AGM rate and temperature measurements call the actual original Solar functions",()=>{
 for(const currentA of [0,5,10,20,54,149.1,170]){
  for(const tempC of [-15,0,20,40]){
   const result=evaluateNativeSolarBattery(native,{chem:"agm",currentA,tempC});
   const direct=native.drainMult("agm",currentA,tempC);
   assert.equal(result.discharge.m,direct.m);
   assert.equal(result.discharge.rate,direct.rate);
   assert.equal(result.discharge.temp,direct.temp);
   assert.equal(result.agmAtCurrent.ah,native.agmCapAt(currentA).ah);
   assert.equal(result.agmTemperatureFactor,native.agmTempFactor(tempC));
   assert.equal(result.peukertDisplayExponent,native.agmPeukert());
   assert.ok(result.discharge.m>0&&Number.isFinite(result.discharge.m));
  }
 }
 const high=evaluateNativeSolarBattery(native,{chem:"agm",currentA:200,tempC:-20});
 assert.ok(high.warnings.some(w=>w.includes("exceeds")));
 assert.ok(high.warnings.some(w=>w.includes("outside")));
});
test("native charging absorption transitions and optional LiTime self-heating match source",()=>{
 for(const chem of ["agm","lfp"]){
  for(const socPercent of [0,70,85,95,99,100]){
   for(const absorptionMinutes of [0,20,120]){
    const p={chem,socPercent,absorptionMinutes,bankAh:230};
    const result=evaluateNativeSolarBattery(native,p);
    const direct=native.absorption(chem,socPercent/100,absorptionMinutes,230);
    assert.equal(result.charging.phase,direct.phase);
    assert.equal(result.charging.mult,direct.mult);
    assert.equal(result.charging.limit,direct.limit);
   }
  }
 }
 for(const heatMode of ["fast","mid","slow"]){
  const v=evaluateNativeSolarBattery(native,{chem:"lfp",tempC:-10,heatMode});
  assert.equal(v.heating.rateCPerMinute,native.HEAT[heatMode].rate);
  assert.equal(v.heating.minutesTo5C,native.heatMinutes(native.HEAT[heatMode].rate,-10,5));
  assert.equal(v.discharge.m,1);
 }
});
test("original Solar study is deterministic and never mutates native model definitions",()=>{
 const before=JSON.stringify(native);
 const input={chem:"agm",currentA:50,tempC:-10,socPercent:94,bankAh:300,absorptionMinutes:12};
 const first=evaluateNativeSolarBattery(native,input);
 assert.deepEqual(first,evaluateNativeSolarBattery(native,input));
 assert.deepEqual(first.inputs,input.heatMode===undefined?{...input,heatMode:"off"}:input);
 assert.equal(JSON.stringify(native),before);
 assert.ok(Object.isFrozen(first));
});
test("invalid, nonfinite, forged, and unsafe Solar study inputs fail closed",()=>{
 const valid={chem:"agm",currentA:10,tempC:20,socPercent:50,bankAh:100};
 for(const [key,values] of Object.entries({
  currentA:[-1,301,NaN,Infinity,"10",null],
  tempC:[-31,61,NaN,Infinity,"20"],
  socPercent:[-1,101,NaN,"50"],
  bankAh:[0,10001,NaN,"100"],
  absorptionMinutes:[-1,1441,Infinity,"5"],
  chem:["other",false,null],
  heatMode:["none",false,null]
 })){
  for(const value of values)
   assert.throws(()=>evaluateNativeSolarBattery(native,{...valid,[key]:value}),/must be|Unsupported/);
 }
 assert.throws(()=>evaluateNativeSolarBattery(native,{...valid,extra:"forged"}),/Unsupported/);
 assert.throws(()=>evaluateNativeSolarBattery(native,{...valid,heatMode:"mid"}),/requires/);
 assert.throws(()=>evaluateNativeSolarBattery(native,{...valid,chem:"lfp",tempC:20,heatMode:"mid"}),/requires/);
 assert.throws(()=>evaluateNativeSolarBattery(native,{...valid,chem:"lfp",tempC:-25,heatMode:"mid"}),/requires/);
 assert.throws(()=>evaluateNativeSolarBattery(null,valid),/original Solar/);
 assert.throws(()=>evaluateNativeSolarBattery(native,[]),/options/);
});

test("source AGM discharge-table sweep is exact original-data evaluation at all source anchor currents",()=>{
 const before=JSON.stringify(native);
 for(const tempC of [-15,0,20,40]){
  const result=evaluateNativeSolarAgmSweep(native,{tempC});
  assert.equal(result.points.length,native.AGM_RATE.length);
  assert.equal(result.tempC,tempC);
  assert.equal(result.source.blob,SOLAR_BATTERY_SOURCE.blob);
  assert.ok(result.points.every(p=>Number.isFinite(p.drainMultiplier)&&p.drainMultiplier>0));
  for(const p of result.points){
   const anchor=native.AGM_RATE.find(row=>row[1]===p.currentA);
   assert.ok(anchor);
   assert.equal(p.sourceRatedHours,anchor[0]);
   assert.equal(p.availableAh,native.agmCapAt(p.currentA).ah);
   assert.equal(p.drainMultiplier,native.drainMult("agm",p.currentA,tempC).m);
   assert.equal(p.sourceRateFactor,native.drainMult("agm",p.currentA,tempC).rate);
  }
  assert.deepEqual(result,evaluateNativeSolarAgmSweep(native,{tempC}));
 }
 assert.equal(JSON.stringify(native),before);
});
test("source AGM sweep rejects nonfinite, unsupported, out-of-table temperatures and forged model",()=>{
 for(const tempC of [-16,41,NaN,Infinity,-Infinity,"20",null])
  assert.throws(()=>evaluateNativeSolarAgmSweep(native,{tempC}),/finite number/);
 assert.throws(()=>evaluateNativeSolarAgmSweep(null),/source capacity table/);
 const broken={...native,AGM_RATE:[[1,5],[1,5],[2,10],[3,20]]};
 assert.throws(()=>evaluateNativeSolarAgmSweep(broken),/Duplicate/);
});
