import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";

test("native tank capacity and power settings edit atomically, preserve water and clock",()=>{
  const controller=createOriginalNativeController({
    initialState:{clockMinute:120,storedWaterL:45,waterCapacityL:100,
      operatingSettings:{backgroundLoadW:85,pumpLoadW:120}},
    advanceHour:()=>{throw Error("not advancing")}
  });
  const edits=[];
  controller.subscribe((snapshot,revision)=>edits.push({snapshot,revision}));
  const update=(capacity,base,pump)=>controller.edit(draft=>{
    if(!Number.isFinite(capacity)||capacity<draft.storedWaterL ||
       !Number.isFinite(base)||base<0||!Number.isFinite(pump)||pump<0)
      throw new RangeError("Invalid native equipment settings");
    draft.waterCapacityL=capacity;
    draft.operatingSettings={...draft.operatingSettings,backgroundLoadW:base,pumpLoadW:pump};
  });
  update(200,30,70);
  assert.deepEqual(controller.snapshot(),{
    clockMinute:120,storedWaterL:45,waterCapacityL:200,
    operatingSettings:{backgroundLoadW:30,pumpLoadW:70}
  });
  assert.equal(controller.revision,1);
  assert.equal(edits.length,1);
  assert.throws(()=>update(44,20,20),RangeError);
  assert.throws(()=>update(220,NaN,20),RangeError);
  assert.equal(controller.revision,1);
  assert.equal(edits.length,1);
  assert.equal(controller.snapshot().waterCapacityL,200);
  assert.equal(controller.snapshot().storedWaterL,45);
});
