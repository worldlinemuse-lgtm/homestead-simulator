import test from "node:test";
import assert from "node:assert/strict";
import {editOriginalSolarSetting,editOriginalFarmEquipment} from "../src/native-equipment-edits.mjs";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";
test("native solar operating edits preserve charge, clock and metering state",()=>{
 const state={clockMinute:60,storedWaterL:10,waterCapacityL:20,solar:{soc:.6,t:60,cfg:{tilt:30,az:180,reserve:10}}};
 const controller=createOriginalNativeController({initialState:state,advanceHour:()=>{throw Error("unexpected advance");}});
 controller.edit(d=>editOriginalSolarSetting(d,"reserve",40));
 controller.edit(d=>editOriginalSolarSetting(d,"tilt",45));
 const after=controller.snapshot();
 assert.equal(after.solar.cfg.reserve,40);assert.equal(after.solar.cfg.tilt,45);
 assert.equal(after.solar.soc,.6);assert.equal(after.clockMinute,60);
 assert.throws(()=>controller.edit(d=>editOriginalSolarSetting(d,"reserve",81)));
 assert.deepEqual(controller.snapshot(),after);
});
test("native Farm edit isolates singleton and retains delivered day ledger",()=>{
 let live={day:2,comps:[{id:1,watts:10}]};
 const farm={checkpoint:()=>structuredClone(live),restoreCheckpoint:s=>{live=structuredClone(s);},snapshot:()=>({day:live.day}),setEquipmentParameter:(id,key,value)=>{const c=live.comps.find(c=>String(c.id)===String(id));if(!c||value<0)throw Error("bad equipment");c[key]=value;return c;}};
 const state={clockMinute:60,storedWaterL:1,waterCapacityL:20,farm:{checkpoint:{day:1,comps:[{id:1,watts:20}]},dayTotals:{electricityDeliveredWh:4}}};
 const controller=createOriginalNativeController({initialState:state,advanceHour:()=>{throw Error("unexpected advance");}});
 controller.edit(d=>editOriginalFarmEquipment(d,farm,"1","watts",55));
 assert.equal(controller.snapshot().farm.checkpoint.comps[0].watts,55);
 assert.equal(controller.snapshot().farm.dayTotals.electricityDeliveredWh,4);
 assert.equal(live.comps[0].watts,10);
 const before=controller.snapshot();assert.throws(()=>controller.edit(d=>editOriginalFarmEquipment(d,farm,"2","watts",1)));
 assert.deepEqual(controller.snapshot(),before);assert.equal(live.day,2);
});
