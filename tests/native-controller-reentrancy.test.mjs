import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";

const world=()=>({clockMinute:0,storedWaterL:0,waterCapacityL:250,solar:{},water:{},farm:{}});
function hour({clockMinute,state}){
  const ledger=Array.from({length:60},(_,i)=>({
    minute:clockMinute+i,requestedWh:0,deliveredWh:0,
    baseServedWh:0,waterServedWh:0,farmServedWh:0,
    waterDeliveredL:0,waterConsumedL:0,waterOverflowL:0
  }));
  return {state:{...state,clockMinute:clockMinute+60},ledger,
    totals:{energyRequestedWh:0,energyDeliveredWh:0,waterProducedL:0,waterConsumedL:0},
    waterOverflowL:0};
}

test("subscriber cannot recursively advance or edit a committed native world",()=>{
  const errors=[],observed=[];
  const controller=createOriginalNativeController({
    initialState:world(),advanceHour:hour,
    onSubscriberError:e=>errors.push(e.message)
  });
  controller.subscribe(()=>{
    controller.advance();
  });
  controller.subscribe((state,revision)=>{
    observed.push([state.clockMinute,revision]);
    assert.throws(()=>controller.edit(s=>s),/mutation already in progress/);
  });
  controller.advance();
  assert.equal(controller.snapshot().clockMinute,60);
  assert.equal(controller.revision,1);
  assert.deepEqual(observed,[[60,1]]);
  assert.equal(errors.length,2);
  assert.ok(errors.every(e=>/mutation already in progress/.test(e)));
  controller.advance();
  assert.equal(controller.snapshot().clockMinute,120);
  assert.equal(controller.revision,2);
});

test("solver callback cannot mutate controller while its outer batch executes",()=>{
  let controller;
  const rejected=[];
  controller=createOriginalNativeController({
    initialState:world(),
    advanceHour:args=>{
      try{controller.edit(s=>s);}catch(e){rejected.push(e.message);}
      return hour(args);
    }
  });
  controller.advance(2);
  assert.equal(controller.snapshot().clockMinute,120);
  assert.equal(controller.revision,1);
  assert.equal(rejected.length,2);
  assert.ok(rejected.every(e=>/mutation already in progress/.test(e)));
});

test("failed edits release transaction lock without modifying authoritative state",()=>{
  const controller=createOriginalNativeController({initialState:world(),advanceHour:hour});
  assert.throws(()=>controller.edit(()=>{throw new Error("invalid edit");}),/invalid edit/);
  assert.equal(controller.revision,0);
  assert.equal(controller.snapshot().clockMinute,0);
  controller.advance();
  assert.equal(controller.snapshot().clockMinute,60);
  assert.equal(controller.revision,1);
});
