import test from "node:test";
import assert from "node:assert/strict";
import {exchangeNativeHour} from "../src/native-minute-exchange.mjs";
const state={solar:{minute:0},water:{liters:0},farm:{liters:0}};
const loads=Array.from({length:60},()=>({baseWh:1,waterWh:2,farmWh:3}));
function run(){
 return exchangeNativeHour({clockMinute:120,loads,state,
 solarStep:({state,requestedWh})=>({deliveredWh:Math.min(requestedWh,4),state:{minute:state.minute+1}}),
 waterStep:({state,deliveredWh})=>({deliveredL:deliveredWh*2,state:{liters:state.liters+deliveredWh*2}}),
 farmStep:({state,waterDeliveredL})=>({state:{liters:state.liters+waterDeliveredL}})});
}
test("chronology, isolation, deterministic replay",()=>{
 const a=run();assert.deepEqual(a,run());assert.equal(a.ledger.length,60);
 assert.equal(a.ledger[59].minute,179);assert.equal(a.state.solar.minute,60);
 assert.equal(a.state.water.liters,240);assert.equal(state.solar.minute,0);
});
test("no double allocation of delivered energy",()=>{
 for(const row of run().ledger){
  assert.equal(row.deliveredWh,4);assert.equal(row.baseServedWh,1);
  assert.equal(row.waterServedWh,2);assert.equal(row.farmServedWh,1);
 }
});
test("forged overdelivery and nonfinite inputs rejected",()=>{
 const args={clockMinute:0,loads,state,
 solarStep:()=>({deliveredWh:999,state:{}}),
 waterStep:()=>({deliveredL:0,state:{}}),
 farmStep:()=>({state:{}})};
 assert.throws(()=>exchangeNativeHour(args),/over-delivery/);
 assert.throws(()=>exchangeNativeHour({...args,loads:loads.map((x,i)=>i===5?{...x,farmWh:NaN}:x),
 solarStep:()=>({deliveredWh:0,state:{}})}),/finite/);
});

test("water transfers are conserved across minute boundaries",()=>{
 const result=exchangeNativeHour({clockMinute:0,loads:Array.from({length:60},()=>({baseWh:0,waterWh:1,farmWh:1})),
 state,solarStep:({requestedWh,state})=>({deliveredWh:requestedWh,state}),
 waterStep:({state})=>({deliveredL:3,state}),
 farmStep:({state,waterDeliveredL})=>({waterConsumedL:Math.min(2,waterDeliveredL),state})});
 assert.equal(result.ledger[0].waterRemainingL,1);
 assert.equal(result.ledger[1].waterRemainingL,2);
 assert.equal(result.ledger[59].waterRemainingL,60);
 assert.equal(result.ledger.reduce((n,x)=>n+x.waterDeliveredL-x.waterConsumedL,0),60);
});
test("farm cannot consume water not delivered by native Water",()=>{
 assert.throws(()=>exchangeNativeHour({clockMinute:0,loads:Array.from({length:60},()=>({baseWh:0,waterWh:0,farmWh:0})),
 state,solarStep:({state})=>({deliveredWh:0,state}),
 waterStep:({state})=>({deliveredL:0,state}),
 farmStep:({state})=>({waterConsumedL:1,state})}),/over-consumption/);
});
