import test from "node:test";
import assert from "node:assert/strict";
import {advanceOriginalNativeHours} from "../src/native-coupled-runtime.mjs";

function fakeHour({clockMinute,state}){
  const ledger=Array.from({length:60},(_,i)=>({minute:clockMinute+i,requestedWh:1,deliveredWh:50/60,baseServedWh:50/60,waterServedWh:0,farmServedWh:0,waterDeliveredL:5/60,waterConsumedL:2/60,waterOverflowL:1/60}));
  return {state:{...state,clockMinute:clockMinute+60,storedWaterL:state.storedWaterL+2},
    ledger,waterOverflowL:1,
    totals:{energyRequestedWh:60,energyDeliveredWh:50,waterProducedL:5,waterConsumedL:2}};
}
test("native multi-hour world preserves chronology, caller state and conservation",()=>{
 const initial={clockMinute:0,storedWaterL:3,solar:{soc:1}};
 const result=advanceOriginalNativeHours({advanceHour:fakeHour,state:initial,hours:3,includeLedger:true});
 assert.equal(initial.clockMinute,0);
 assert.equal(initial.storedWaterL,3);
 assert.equal(result.state.clockMinute,180);
 assert.equal(result.state.storedWaterL,9);
 assert.equal(result.totals.energyRequestedWh,180);
 assert.equal(result.totals.energyDeliveredWh,150);
 assert.equal(result.totals.waterProducedL,15);
 assert.equal(result.totals.waterConsumedL,6);
 assert.equal(result.totals.waterOverflowL,3);
 assert.equal(result.ledger.length,180);
 assert.deepEqual(result.ledger.map(x=>x.minute),Array.from({length:180},(_,i)=>i));
 assert.equal(3+15-6-3,result.state.storedWaterL);
});
test("native batches reject malformed clocks and missing minutes",()=>{
 assert.throws(()=>advanceOriginalNativeHours({advanceHour:fakeHour,state:{clockMinute:1},hours:1}),/aligned/);
 assert.throws(()=>advanceOriginalNativeHours({advanceHour:fakeHour,state:{clockMinute:0},hours:0}),/batch/);
 assert.throws(()=>advanceOriginalNativeHours({advanceHour:()=>({state:{clockMinute:60},ledger:[]}),state:{clockMinute:0}}),/ledger/);
});
test("native batch failures do not mutate caller's world",()=>{
 const initial={clockMinute:0,storedWaterL:3,nested:{count:0}};
 assert.throws(()=>advanceOriginalNativeHours({state:initial,hours:2,advanceHour:({clockMinute,state})=>{
   state.nested.count++;
   if(clockMinute===60)throw Error("engine failure");
   return fakeHour({clockMinute,state});
 }}),/engine failure/);
 assert.deepEqual(initial,{clockMinute:0,storedWaterL:3,nested:{count:0}});
});

test("native batch rejects energy allocation, summary and water inventory corruption",()=>{
 const initial={clockMinute:0,storedWaterL:3};
 const corrupt=(change)=>({clockMinute,state})=>{
   const result=fakeHour({clockMinute,state});change(result);return result;
 };
 assert.throws(()=>advanceOriginalNativeHours({state:initial,advanceHour:corrupt(r=>{r.ledger[0].baseServedWh=0;})}),/allocation mismatch/);
 assert.throws(()=>advanceOriginalNativeHours({state:initial,advanceHour:corrupt(r=>{r.totals.waterProducedL=10;})}),/ledger mismatch/);
 assert.throws(()=>advanceOriginalNativeHours({state:initial,advanceHour:corrupt(r=>{r.state.storedWaterL=99;})}),/inventory mismatch/);
 assert.throws(()=>advanceOriginalNativeHours({state:initial,advanceHour:corrupt(r=>{r.ledger[0].deliveredWh=2;})}),/over-delivery/);
 assert.deepEqual(initial,{clockMinute:0,storedWaterL:3});
});
