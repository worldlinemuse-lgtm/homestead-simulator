import test from "node:test";
import assert from "node:assert/strict";
import {bindNativeWorldViews} from "../src/native-world-view-binding.mjs";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";

const make=()=>{
 const initialState={clockMinute:0,storedWaterL:4,waterCapacityL:10};
 const controller=createOriginalNativeController({initialState,advanceHour:()=>{throw Error("not used")}});
 const scene=[],utilities=[];
 const binding=bindNativeWorldViews({
  controller,
  scene:{renderNativeWorld:(state,revision)=>{scene.push({state,revision});state.storedWaterL=999;}},
  utilities:{renderNativeWorld:(state,revision)=>utilities.push({state,revision})}
 });
 return {controller,binding,scene,utilities};
};
test("scene and Utilities receive independent snapshots of the same authoritative revision",()=>{
 const {controller,binding,scene,utilities}=make();
 assert.equal(scene.length,1);assert.equal(utilities.length,1);
 assert.equal(utilities[0].state.storedWaterL,4);
 binding.editAsset("tank-1",(draft,id)=>{assert.equal(id,"tank-1");draft.storedWaterL=6;});
 assert.equal(controller.snapshot().storedWaterL,6);
 assert.equal(scene[1].revision,1);assert.equal(utilities[1].revision,1);
 assert.equal(utilities[1].state.storedWaterL,6);
 binding.dispose();
 controller.edit(s=>{s.storedWaterL=7;});
 assert.equal(scene.length,2);assert.equal(utilities.length,2);
 assert.throws(()=>binding.editAsset("tank-1",()=>{}),/disposed/);
});
test("invalid asset edits cannot commit state or notify either view",()=>{
 const {controller,binding,scene,utilities}=make();
 assert.throws(()=>binding.editAsset("",()=>{}),/identity/);
 assert.throws(()=>binding.editAsset("tank-1",s=>{s.storedWaterL=20;}),/capacity/);
 assert.equal(controller.snapshot().storedWaterL,4);
 assert.equal(scene.length,1);assert.equal(utilities.length,1);
 binding.dispose();
});
test("render failures are reported without starving the other view",()=>{
 const controller=createOriginalNativeController({
  initialState:{clockMinute:0,storedWaterL:0,waterCapacityL:1},
  advanceHour:()=>{throw Error("unused")}
 });
 const errors=[],seen=[];
 const binding=bindNativeWorldViews({controller,
  scene:{renderNativeWorld(){throw Error("render failed");}},
  utilities:{renderNativeWorld:s=>seen.push(s)},
  onError:e=>errors.push(e.message)
 });
 controller.edit(s=>{s.storedWaterL=1;});
 assert.deepEqual(errors,["render failed","render failed"]);
 assert.equal(seen.length,2);assert.equal(seen[1].storedWaterL,1);
 binding.dispose();
});
