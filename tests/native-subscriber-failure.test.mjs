import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";

test("failed scene subscriber cannot hide a committed native hour from Utilities",()=>{
  const reported=[];
  const controller=createOriginalNativeController({
    initialState:{clockMinute:0,storedWaterL:0,waterCapacityL:10},
    advanceHour:({clockMinute,state})=>({
      state:{...state,clockMinute:clockMinute+60},
      ledger:Array.from({length:60},(_,i)=>({
        minute:clockMinute+i,requestedWh:0,deliveredWh:0,
        baseServedWh:0,waterServedWh:0,farmServedWh:0,
        waterDeliveredL:0,waterConsumedL:0,waterOverflowL:0
      })),
      totals:{energyRequestedWh:0,energyDeliveredWh:0,waterProducedL:0,waterConsumedL:0},
      waterOverflowL:0
    }),
    onSubscriberError:(error,revision)=>reported.push([error.message,revision])
  });
  const observed=[];
  controller.subscribe(()=>{throw new Error("3D renderer unavailable");});
  controller.subscribe((state,revision)=>observed.push([state.clockMinute,revision]));
  const result=controller.advance();
  assert.equal(result.state.clockMinute,60);
  assert.equal(controller.snapshot().clockMinute,60);
  assert.equal(controller.revision,1);
  assert.deepEqual(observed,[[60,1]]);
  assert.deepEqual(reported,[["3D renderer unavailable",1]]);
  controller.advance();
  assert.deepEqual(observed,[[60,1],[120,2]]);
  assert.equal(controller.snapshot().clockMinute,120);
});

test("invalid subscriber error handler rejected",()=>{
  assert.throws(()=>createOriginalNativeController({
    initialState:{clockMinute:0},advanceHour:()=>{},onSubscriberError:7
  }),/handler/);
});
