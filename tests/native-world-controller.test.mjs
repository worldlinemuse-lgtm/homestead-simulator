import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";

const initial=()=>({clockMinute:0,storedWaterL:3,waterCapacityL:10,solar:{soc:50},water:{parts:[]},farm:{checkpoint:{}}});
test("scene and Utilities observers share one isolated authoritative state",()=>{
 const controller=createOriginalNativeController({initialState:initial(),advanceHour:()=>{throw Error("unused")}});
 const observed=[];
 const unsubscribe=controller.subscribe((state,revision)=>observed.push({state,revision}));
 const outside=controller.snapshot();outside.solar.soc=0;
 assert.equal(controller.snapshot().solar.soc,50);
 controller.edit(draft=>{draft.solar.soc=60;});
 assert.equal(controller.snapshot().solar.soc,60);
 assert.equal(observed[0].revision,1);
 observed[0].state.solar.soc=0;
 assert.equal(controller.snapshot().solar.soc,60);
 unsubscribe();
 controller.edit(draft=>{draft.solar.soc=70;});
 assert.equal(observed.length,1);
});
test("invalid edits and failed execution never commit",()=>{
 const controller=createOriginalNativeController({initialState:initial(),advanceHour:()=>{throw Error("engine failure")}});
 assert.throws(()=>controller.edit(d=>{d.clockMinute=60;}),/clock/);
 assert.throws(()=>controller.edit(d=>{d.storedWaterL=100;}),/capacity/);
 assert.throws(()=>controller.edit(()=>{throw Error("invalid object");}),/invalid object/);
 assert.throws(()=>controller.advance(),/engine failure/);
 assert.deepEqual(controller.snapshot(),initial());
 assert.equal(controller.revision,0);
});
test("successful native hour commits once and returns isolated snapshots",()=>{
 const controller=createOriginalNativeController({initialState:initial(),advanceHour:({clockMinute,state})=>{
 const next=structuredClone(state);next.clockMinute+=60;
 const ledger=Array.from({length:60},(_,i)=>({
 minute:clockMinute+i,requestedWh:0,deliveredWh:0,
 baseServedWh:0,waterServedWh:0,farmServedWh:0,
 waterDeliveredL:0,waterConsumedL:0,waterOverflowL:0
 }));
 return {state:next,ledger,waterOverflowL:0,totals:{
 energyRequestedWh:0,energyDeliveredWh:0,waterProducedL:0,waterConsumedL:0
 }};
 }});
 const result=controller.advance(2);
 assert.equal(controller.snapshot().clockMinute,120);
 assert.equal(result.state.clockMinute,120);
 assert.equal(controller.revision,1);
 result.state.clockMinute=999;
 assert.equal(controller.snapshot().clockMinute,120);
});

test("absolute native clock target advances atomically and refuses rewind",()=>{
 const controller=createOriginalNativeController({initialState:initial(),advanceHour:({clockMinute,state})=>{
  const next=structuredClone(state);next.clockMinute=clockMinute+60;
  return {state:next,ledger:Array.from({length:60},(_,i)=>({
   minute:clockMinute+i,requestedWh:0,deliveredWh:0,baseServedWh:0,
   waterServedWh:0,farmServedWh:0,waterDeliveredL:0,
   waterConsumedL:0,waterOverflowL:0
  })),waterOverflowL:0,totals:{
   energyRequestedWh:0,energyDeliveredWh:0,waterProducedL:0,waterConsumedL:0
  }};
 }});
 assert.throws(()=>controller.advanceToMinute(61),/aligned/);
 assert.throws(()=>controller.advanceToMinute(0),/later/);
 assert.equal(controller.advanceToMinute(180).state.clockMinute,180);
 assert.equal(controller.revision,1);
 assert.throws(()=>controller.advanceToMinute(120),/later/);
 assert.equal(controller.snapshot().clockMinute,180);
 assert.equal(controller.revision,1);
});
