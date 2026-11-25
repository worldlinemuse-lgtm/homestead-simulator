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

import {captureOriginalSolarState,createOriginalSolarMinuteStep} from "../src/native-solar-minute.mjs";
test("source grabState omits cfg; adapter persists and restores operating settings",()=>{
 const sim={S:{t:0,cfg:{tilt:30,az:180,reserve:10},stats:{served:0},soc:.5,playing:false},
 grabState(){const {cfg,playing,quiet,...state}=this.S;return state;},
 putState(state){const {cfg,...rest}=state;Object.assign(this.S,rest);},
 step(){assert.equal(this.S.cfg.tilt,45);this.S.t++;this.S.live={served:0,mOut:0};}};
 const state=captureOriginalSolarState(sim);
 editOriginalSolarSetting({solar:state},"tilt",45);
 const result=createOriginalSolarMinuteStep(sim)({minute:0,requestedWh:0,state});
 assert.equal(result.state.cfg.tilt,45);assert.equal(sim.S.cfg.tilt,30);assert.equal(sim.S.t,0);
});

test("native battery expansion accounts for external charged inventory and restores source config",()=>{
 const sim={BATT:{id:"bb100",maxPar:8},S:{cfg:{batt:"bb100",bpar:1}},capWh(){return 2560*this.S.cfg.bpar;}};
 const original=sim.S.cfg;
 const state={clockMinute:60,storedWaterL:1,waterCapacityL:20,solar:{soc:.5,lastI:10,cfg:{batt:"bb100",bpar:2,ser:2,par:2,nMppt:1,shade:0},mpptDead:true}};
 const controller=createOriginalNativeController({initialState:state,advanceHour:()=>{throw Error("unexpected advance");}});
 controller.edit(d=>editOriginalSolarSetting(d,"bpar",3,sim));
 let after=controller.snapshot();
 assert.equal(after.solar.soc,.5);assert.equal(after.solar.lastI,0);
 assert.equal(after.batteryInventoryEdits[0].externalStoredWhDelta,1280);
 assert.equal(sim.S.cfg,original);
 assert.throws(()=>controller.edit(d=>editOriginalSolarSetting(d,"bpar",9,sim)));
 assert.deepEqual(controller.snapshot(),after);
 controller.edit(d=>editOriginalSolarSetting(d,"bpar",1,sim));
 assert.equal(controller.snapshot().batteryInventoryEdits[1].externalStoredWhDelta,-2560);
 controller.edit(d=>editOriginalSolarSetting(d,"par",3,sim));
 after=controller.snapshot();assert.equal(after.solar.cfg.par,3);assert.equal(after.solar.mpptDead,false);
 assert.throws(()=>controller.edit(d=>editOriginalSolarSetting(d,"ser",0,sim)));
 assert.deepEqual(controller.snapshot(),after);assert.equal(after.clockMinute,60);
});
