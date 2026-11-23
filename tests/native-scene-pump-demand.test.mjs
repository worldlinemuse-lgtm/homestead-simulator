import test from "node:test";
import assert from "node:assert/strict";
import {createNativeSceneBridge} from "../src/native-scene-bridge.mjs";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";

test("scene-selected native pump electrical setting reaches authoritative controller",()=>{
  let selected={id:"site-water-treatment"};
  const scene={editor:{
    list:()=>[{id:"site-water-treatment"},{id:"unmapped"}],
    selected:()=>selected,
    select:id=>{selected={id};}
  }};
  const controller=createOriginalNativeController({
    initialState:{clockMinute:60,storedWaterL:25,waterCapacityL:100,
      operatingSettings:{backgroundLoadW:85,pumpLoadW:120}},
    advanceHour:()=>{throw Error("no advance expected");}
  });
  const revisions=[];
  controller.subscribe((snapshot,revision)=>revisions.push(revision));
  const bridge=createNativeSceneBridge({
    scene,assetMappings:{"site-water-treatment":"original-pump-1"},
    editNativeAsset:(id,patch)=>controller.edit(draft=>{
      if(id!=="original-pump-1"||Object.keys(patch).join()!=="pumpLoadW"||
         !Number.isFinite(patch.pumpLoadW)||patch.pumpLoadW<0)
        throw new RangeError("Invalid mapped pump setting");
      draft.operatingSettings.pumpLoadW=patch.pumpLoadW;
    })
  });
  bridge.renderNativeWorld(controller.snapshot(),controller.revision);
  bridge.select("site-water-treatment");
  bridge.editSelected({pumpLoadW:65});
  assert.equal(controller.snapshot().operatingSettings.pumpLoadW,65);
  assert.equal(controller.snapshot().storedWaterL,25);
  assert.equal(controller.snapshot().clockMinute,60);
  assert.deepEqual(revisions,[1]);
  assert.throws(()=>bridge.editSelected({pumpLoadW:-1}),RangeError);
  assert.equal(controller.revision,1);
  bridge.select("unmapped");
  assert.throws(()=>bridge.editSelected({pumpLoadW:40}),RangeError);
  assert.equal(controller.snapshot().operatingSettings.pumpLoadW,65);
  bridge.dispose();
});
