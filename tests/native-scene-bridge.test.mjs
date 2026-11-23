import test from "node:test";
import assert from "node:assert/strict";
import {createNativeSceneBridge} from "../src/native-scene-bridge.mjs";

const scene=()=>({editor:{
 list:()=>[{id:"panel-1",label:"Solar panel"},{id:"tank-1",label:"Tank"}],
 selected:()=>({id:"tank-1"})
}});
test("existing object identities and authoritative snapshots stay isolated",()=>{
 const events=[];
 const bridge=createNativeSceneBridge({scene:scene(),
  onSelection:(item,snapshot,revision)=>events.push([item,snapshot,revision]),
  onSnapshot:(snapshot)=>{snapshot.storedWaterL=999;}});
 const state={clockMinute:60,storedWaterL:12};
 bridge.renderNativeWorld(state,1);
 state.storedWaterL=200;
 assert.equal(bridge.snapshot().storedWaterL,12);
 assert.equal(bridge.selected().id,"tank-1");
 assert.equal(events[0][1].storedWaterL,12);
 events[0][1].storedWaterL=300;
 assert.equal(bridge.snapshot().storedWaterL,12);
 assert.throws(()=>bridge.select("missing"),/Unknown/);
 assert.throws(()=>bridge.renderNativeWorld({clockMinute:120},0),/out-of-order/);
 bridge.dispose();
 assert.throws(()=>bridge.selected(),/disposed/);
});
test("rejects missing scene editor and malformed clocks",()=>{
 assert.throws(()=>createNativeSceneBridge({scene:{}}),/editor/);
 const bridge=createNativeSceneBridge({scene:scene()});
 assert.throws(()=>bridge.renderNativeWorld({clockMinute:1.5},0),/Invalid/);
});
