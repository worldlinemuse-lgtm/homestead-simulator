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

test("water persists between hours, capacity overflow is accounted and original state is isolated",()=>{
 const constant=Array.from({length:60},()=>({baseWh:0,waterWh:1,farmWh:0}));
 const callbacks={
  solarStep:({state,requestedWh})=>({state,deliveredWh:requestedWh}),
  waterStep:({state})=>({state,deliveredL:1}),
  farmStep:({state})=>({state,waterConsumedL:0})
 };
 const original={...state,storedWaterL:5,waterCapacityL:50};
 const first=exchangeNativeHour({clockMinute:0,loads:constant,state:original,...callbacks});
 assert.equal(first.state.storedWaterL,50);
 assert.equal(first.waterOverflowL,15);
 assert.equal(first.ledger.reduce((a,x)=>a+x.waterOverflowL,0),15);
 assert.equal(original.storedWaterL,5);
 const second=exchangeNativeHour({clockMinute:60,loads:constant,state:first.state,...callbacks});
 assert.equal(second.state.storedWaterL,50);
 assert.equal(second.waterOverflowL,60);
 assert.equal(second.ledger[0].minute,60);
});
test("invalid stored water and capacity fail before callbacks run",()=>{
 let called=false;
 const callbacks={
  solarStep:()=>{called=true;return {deliveredWh:0,state:{}};},
  waterStep:()=>({deliveredL:0,state:{}}),
  farmStep:()=>({state:{}})
 };
 for(const stateOverride of [{storedWaterL:-1},{storedWaterL:10,waterCapacityL:5},{storedWaterL:Infinity}]){
  assert.throws(()=>exchangeNativeHour({clockMinute:0,loads,state:{...state,...stateOverride},...callbacks}),/water|finite|capacity/i);
 }
 assert.equal(called,false);
});

test("world clock advances exactly one hour and rejects skipped or repeated hours",()=>{
 const first=run();
 assert.equal(first.state.clockMinute,180);
 const args={clockMinute:180,loads,state:first.state,
 solarStep:({state,requestedWh})=>({state,deliveredWh:requestedWh}),
 waterStep:({state})=>({state,deliveredL:0}),
 farmStep:({state})=>({state,waterConsumedL:0})};
 const second=exchangeNativeHour(args);
 assert.equal(second.state.clockMinute,240);
 assert.throws(()=>exchangeNativeHour({...args,clockMinute:240,state:first.state}),/discontinuity/);
 assert.throws(()=>exchangeNativeHour({...args,clockMinute:120}),/discontinuity/);
});
test("callback mutations do not escape failed transactions",()=>{
 const initial={solar:{x:1},water:{x:2},farm:{x:3},storedWaterL:2};
 const before=structuredClone(initial);
 assert.throws(()=>exchangeNativeHour({clockMinute:0,loads,
 state:initial,
 solarStep:({state,requestedWh})=>{state.x=999;return {state,deliveredWh:requestedWh};},
 waterStep:({state})=>{state.x=999;return {state,deliveredL:0};},
 farmStep:({state})=>{state.x=999;return {state,waterConsumedL:999};}}),/over-consumption/);
 assert.deepEqual(initial,before);
});
test("aggregate energy and water accounting reconcile with minute ledger",()=>{
 const result=run();
 assert.equal(result.totals.energyRequestedWh,360);
 assert.equal(result.totals.energyDeliveredWh,240);
 assert.equal(result.totals.waterProducedL,240);
 assert.equal(result.totals.waterConsumedL,0);
 assert.equal(result.totals.waterStoredL,240);
 assert.equal(result.ledger.reduce((s,x)=>s+x.deliveredWh,0),result.totals.energyDeliveredWh);
});
test("invalid demand in final minute is rejected before native dispatch",()=>{
 let calls=0;
 assert.throws(()=>exchangeNativeHour({clockMinute:0,loads:loads.map((x,i)=>i===59?{...x,baseWh:Infinity}:x),state,
 solarStep:()=>{calls++;return {state:{},deliveredWh:0};},
 waterStep:()=>({state:{},deliveredL:0}),
 farmStep:()=>({state:{},waterConsumedL:0})}),/finite/);
 assert.equal(calls,0);
});
