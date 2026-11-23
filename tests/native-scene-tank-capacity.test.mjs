import test from "node:test";
import assert from "node:assert/strict";
import {createNativeSceneBridge} from "../src/native-scene-bridge.mjs";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";

test("selected 3D tank capacity shares native Utilities inventory and controller revision",()=>{
  let selected={id:"site-water-storage"};
  const scene={editor:{
    list:()=>[{id:"site-water-storage"},{id:"site-water-treatment"},{id:"unmapped"}],
    selected:()=>selected,
    select:id=>{selected={id};}
  }};
  const controller=createOriginalNativeController({
    initialState:{clockMinute:120,storedWaterL:48,waterCapacityL:100,
      operatingSettings:{pumpLoadW:120}},
    advanceHour:()=>{throw Error("editing must not advance time");}
  });
  const seen=[];
  controller.subscribe((state,revision)=>seen.push([revision,state.waterCapacityL,state.storedWaterL]));
  const bridge=createNativeSceneBridge({
    scene,assetMappings:{"site-water-storage":"native-treated-water-storage"},
    editNativeAsset:(id,patch)=>controller.edit(draft=>{
      if(id!=="native-treated-water-storage" ||
         Object.keys(patch).length!==1 || !Object.hasOwn(patch,"waterCapacityL"))
        throw new RangeError("Invalid native tank mapping");
      const capacity=patch.waterCapacityL;
      if(!Number.isFinite(capacity)||capacity<draft.storedWaterL)
        throw new RangeError("Tank cannot discard stored water");
      draft.waterCapacityL=capacity;
    })
  });
  bridge.renderNativeWorld(controller.snapshot(),controller.revision);
  bridge.select("site-water-storage");
  bridge.editSelected({waterCapacityL:50});
  assert.deepEqual(seen,[[1,50,48]]);
  assert.equal(controller.snapshot().clockMinute,120);
  assert.equal(controller.snapshot().operatingSettings.pumpLoadW,120);
  for(const bad of [47,-1,Infinity]){
    assert.throws(()=>bridge.editSelected({waterCapacityL:bad}));
    assert.equal(controller.revision,1);
    assert.equal(controller.snapshot().waterCapacityL,50);
  }
  bridge.select("unmapped");
  assert.throws(()=>bridge.editSelected({waterCapacityL:70}),RangeError);
  bridge.dispose();
});
