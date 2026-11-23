import test from "node:test";
import assert from "node:assert/strict";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";

const initialState=()=>({
  clockMinute:0,storedWaterL:5,waterCapacityL:100,
  solar:{soc:0.5},water:{tank:{volumeL:5}},farm:{animals:[]}
});

test("scene subscriber cannot corrupt Utilities subscriber or authoritative native state",()=>{
  const controller=createOriginalNativeController({
    initialState:initialState(),
    advanceHour:()=>{throw new Error("not needed");}
  });
  const received=[];
  controller.subscribe((state)=>{
    state.storedWaterL=999;
    state.solar.soc=-1;
    state.water.tank.volumeL=999;
    state.farm.animals.push({id:"injected"});
  });
  controller.subscribe((state,revision)=>received.push({state,revision}));
  const result=controller.edit(draft=>{
    draft.storedWaterL=12;
    draft.water.tank.volumeL=12;
  });
  assert.equal(controller.revision,1);
  assert.equal(result.storedWaterL,12);
  assert.equal(received.length,1);
  assert.equal(received[0].revision,1);
  assert.equal(received[0].state.storedWaterL,12);
  assert.equal(received[0].state.solar.soc,0.5);
  assert.equal(received[0].state.water.tank.volumeL,12);
  assert.deepEqual(received[0].state.farm.animals,[]);
  assert.deepEqual(controller.snapshot(),result);
});

test("unsubscribed views receive no further native revisions",()=>{
  const controller=createOriginalNativeController({
    initialState:initialState(),
    advanceHour:()=>{throw new Error("not needed");}
  });
  let calls=0;
  const unsubscribe=controller.subscribe(()=>calls++);
  controller.edit(draft=>{draft.storedWaterL=6;});
  unsubscribe();
  controller.edit(draft=>{draft.storedWaterL=7;});
  assert.equal(calls,1);
  assert.equal(controller.revision,2);
  assert.equal(controller.snapshot().storedWaterL,7);
});
