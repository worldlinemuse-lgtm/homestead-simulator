import test from "node:test";
import assert from "node:assert/strict";
import {createNativeSceneBridge} from "../src/native-scene-bridge.mjs";

function scene(){
  const items=[{id:"pv-visual",label:"PV array"},{id:"decoration",label:"Decorative barrel"}];
  let selected=items[0];
  return {editor:{list:()=>items,selected:()=>selected},choose(id){selected=items.find(x=>x.id===id)}};
}

test("verified 3D identity sends one finite native parameter to controller",()=>{
  const world=scene(),calls=[];
  const bridge=createNativeSceneBridge({scene:world,
    assetMappings:{"pv-visual":"solar:array:1"},
    editNativeAsset:(id,patch)=>{calls.push({id,patch});return 17;}});
  assert.equal(bridge.editSelected({tilt:35}),17);
  assert.deepEqual(calls,[{id:"solar:array:1",patch:{tilt:35}}]);
  world.choose("decoration");
  assert.throws(()=>bridge.editSelected({tilt:35}),/verified native equipment mapping/);
  assert.equal(calls.length,1);
});

test("invalid edits never reach original engine",()=>{
  const world=scene(),calls=[];
  const bridge=createNativeSceneBridge({scene:world,
    assetMappings:{"pv-visual":"solar:array:1"},
    editNativeAsset:(...args)=>calls.push(args)});
  for(const patch of [{tilt:Infinity},{tilt:NaN},{tilt:10,watts:200},{__proto__:null},null,{tilt:"40"}])
    assert.throws(()=>bridge.editSelected(patch));
  assert.equal(calls.length,0);
  bridge.dispose();
  assert.throws(()=>bridge.editSelected({tilt:20}),/disposed/);
});

test("missing native controller never pretends visual edits are physical",()=>{
  const bridge=createNativeSceneBridge({scene:scene()});
  assert.throws(()=>bridge.editSelected({tilt:20}),/not connected/);
});
