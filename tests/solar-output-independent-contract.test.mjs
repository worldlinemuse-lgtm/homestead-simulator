// Independent source-output validation contract; no primary implementation edits.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {evaluateNativeSolarBattery,evaluateNativeSolarAgmSweep} from "../src/solar-battery-utility.mjs";
const source=fs.readFileSync(new URL("../vendor/solar-battery-native.js",import.meta.url),"utf8");
const ctx={module:{exports:{}},window:undefined};
vm.runInNewContext(source,ctx,{timeout:30000});
const native=ctx.module.exports;
const base={chem:"agm",currentA:10,tempC:20,socPercent:50,bankAh:100};
const corruptions=[
 ["discharge rate",m=>({...m,drainMult:(...a)=>({...m.drainMult(...a),rate:Infinity})}),base],
 ["discharge temperature",m=>({...m,drainMult:(...a)=>({...m.drainMult(...a),temp:NaN})}),base],
 ["AGM temperature factor",m=>({...m,agmTempFactor:()=>Infinity}),base],
 ["Peukert exponent",m=>({...m,agmPeukert:()=>NaN}),base],
 ["charging limit",m=>({...m,absorption:(...a)=>({...m.absorption(...a),limit:NaN})}),base],
 ["charging phase",m=>({...m,absorption:(...a)=>({...m.absorption(...a),phase:"forged"})}),base],
 ["heater rate",m=>({...m,HEAT:{...m.HEAT,fast:{...m.HEAT.fast,rate:NaN}}}),{...base,chem:"lfp",tempC:-10,heatMode:"fast"}]
];
for(const [label,corrupt,options] of corruptions){
 test("fail closed on corrupted native Solar output: "+label,()=>{
  assert.throws(()=>evaluateNativeSolarBattery(corrupt(native),options),/invalid|finite|original|source|phase/i);
 });
}
test("source sweep rejects forged nonfinite rate and temperature factors",()=>{
 for(const field of ["rate","temp"]){
  const broken={...native,drainMult:(...a)=>({...native.drainMult(...a),[field]:NaN})};
  assert.throws(()=>evaluateNativeSolarAgmSweep(broken),/nonfinite|invalid|finite/i);
 }
});
test("original native model remains deterministic and unchanged",()=>{
 const before=JSON.stringify(native);
 const first=evaluateNativeSolarBattery(native,base);
 assert.deepEqual(first,evaluateNativeSolarBattery(native,base));
 const sweep=evaluateNativeSolarAgmSweep(native,{tempC:20});
 assert.deepEqual(sweep,evaluateNativeSolarAgmSweep(native,{tempC:20}));
 assert.equal(JSON.stringify(native),before);
});

test("source sweep rejects malformed table tuples, duplicates and forged nonfinite anchors",()=>{
 const badTables=[
  [[1,10],[2,20],[3,30],null],
  [[1,10],[2,20],[3,30],["4",40]],
  [[1,10],[2,20],[3,30],[4,NaN]],
  [[1,10],[2,20],[3,30],[4,Infinity]],
  [[1,10],[2,20],[3,30],[4,10]]
 ];
 for(const AGM_RATE of badTables){
  const broken={...native,AGM_RATE};
  assert.throws(()=>evaluateNativeSolarAgmSweep(broken,{tempC:20}),
   /invalid|finite|duplicate|source|iterable|object|number/i);
 }
});
test("native Solar inputs reject type coercion, forged fields and nonfinite values",()=>{
 for(const options of [
  {...base,currentA:"10"}, {...base,tempC:NaN},
  {...base,socPercent:Infinity},{...base,bankAh:0},
  {...base,unknownField:42}, {...base,chem:"forged"},
  {...base,heatMode:"turbo"},null,[],42
 ]){
  assert.throws(()=>evaluateNativeSolarBattery(native,options));
 }
 for(const options of [{tempC:NaN},{tempC:"20"},{tempC:-15.001},{tempC:40.001}]){
  assert.throws(()=>evaluateNativeSolarAgmSweep(native,options));
 }
});
test("source sweep must not silently accept zero, negative or nonfinite secondary outputs",()=>{
 const badModels=[
  {...native,drainMult:(...a)=>({...native.drainMult(...a),rate:0})},
  {...native,drainMult:(...a)=>({...native.drainMult(...a),temp:-1})},
  {...native,agmCapAt:(...a)=>({...native.agmCapAt(...a),ah:Infinity})}
 ];
 for(const model of badModels)
  assert.throws(()=>evaluateNativeSolarAgmSweep(model,{tempC:20}),/invalid|finite|source/i);
});
