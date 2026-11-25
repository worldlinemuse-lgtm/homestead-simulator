import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
import {projectNativeSceneSnapshot} from "../src/native-scene-projection.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
function original(){
 const ctx=vm.createContext({console,structuredClone,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,Uint8Array});
 for(const pathName of ["vendor/water-engine.js","vendor/farm-core.js"])
  vm.runInContext(fs.readFileSync(path.join(root,pathName),"utf8"),ctx,{filename:pathName,timeout:60000});
 const farm=ctx.HomesteadFarmCore,water=ctx.HomesteadWaterCore;
 farm.reset(7);farm.advanceDay();
 return {farm,water};
}
const legacy={
 clock:{hours:0,startHour:9,hourOfDay:9,date:"2026-11-04"},
 config:{batteryCapacityWh:8000,waterStorageCapacityL:250,
  backgroundLoadW:85,pumpElectricalW:120,pumpPressurePsi:50},
 cumulative:{},last:null
};
test("original Farm snapshot and real native meter drive the 3D view without mutating Farm",()=>{
 const {farm,water}=original();
 const originalFarm=JSON.stringify(farm.snapshot()),originalCheckpoint=JSON.stringify(farm.checkpoint());
 const world={clockMinute:600,storedWaterL:8,waterCapacityL:15,
  solar:{soc:0.6},water:water.buildPreset("E"),
  farm:{checkpoint:structuredClone(farm.checkpoint())},
  operatingSettings:{backgroundLoadW:75,pumpLoadW:110}};
 const ledger=Array.from({length:60},(_,i)=>({
  minute:540+i,requestedWh:3,deliveredWh:2,
  baseRequestedWh:1,waterRequestedWh:1,farmRequestedWh:1,
  baseServedWh:1,waterServedWh:1,farmServedWh:0,
  waterDeliveredL:0.05,waterConsumedL:1/60,waterOverflowL:0,
  waterRemainingL:6+(i+1)*2/60,
  native:{solar:{pvControllerWh:0.5},water:{pumpEnabled:true},farm:{waterRequiredL:0.04}}
 }));
 const view=projectNativeSceneSnapshot({
  world,legacy,farmCore:farm,lastBatch:{ledger},startHour:9
 });
 assert.equal(view.model,"original-native-coupled-runtime");
 assert.equal(view.clock.hours,1);
 assert.equal(view.clock.hourOfDay,10);
 assert.equal(view.nativeMeter.energyRequestedWh,180);
 assert.equal(view.nativeMeter.energyDeliveredWh,120);
 assert.ok(Math.abs(view.nativeMeter.pvControllerWh-30)<1e-7);
 assert.equal(view.config.backgroundLoadW,75);
 assert.equal(view.config.waterStorageCapacityL,15);
 assert.equal(view.config.pumpElectricalW,110);
 assert.equal(view.batteryWh,4800); // presentation ratio only, not physical battery-energy claim
 assert.equal(view.last.energy.servedPumpWh,60);
 assert.ok(Math.abs(view.last.water.treatedL-3)<1e-7);
 assert.equal(view.last.electricalLoads.farmDeficitWh,60);
 assert.equal(view.nativeMeter.minutes,60);
 assert.equal(JSON.stringify(farm.snapshot()),originalFarm);
 assert.equal(JSON.stringify(farm.checkpoint()),originalCheckpoint);
 view.farm.animals.length=0;view.config.backgroundLoadW=0;
 assert.equal(JSON.stringify(farm.snapshot()),originalFarm);
 assert.equal(legacy.config.backgroundLoadW,85);
});
test("native projection does not manufacture metering when no complete batch exists",()=>{
 const {farm,water}=original();
 const world={clockMinute:540,storedWaterL:4,waterCapacityL:250,
  solar:{soc:0.7},water:water.buildPreset("E"),
  farm:{checkpoint:structuredClone(farm.checkpoint())}};
 const view=projectNativeSceneSnapshot({world,legacy,farmCore:farm});
 assert.equal(view.nativeMeter,null);assert.equal(view.last,null);
 assert.equal(view.clock.hourOfDay,9);
 assert.equal(view.nativeSolarSoc,0.7);
});
test("source mismatch, forged allocations and nonfinite state fail without Farm mutation",()=>{
 const {farm,water}=original();
 const before=JSON.stringify(farm.snapshot());
 const world={clockMinute:600,storedWaterL:8,waterCapacityL:15,
  solar:{soc:0.5},water:water.buildPreset("E"),
  farm:{checkpoint:structuredClone(farm.checkpoint())}};
 const valid=Array.from({length:60},(_,i)=>({
  minute:540+i,requestedWh:0,deliveredWh:0,
  baseRequestedWh:0,waterRequestedWh:0,farmRequestedWh:0,
  baseServedWh:0,waterServedWh:0,farmServedWh:0,
  waterDeliveredL:0,waterConsumedL:0,waterOverflowL:0,
  waterRemainingL:8,native:{}
 }));
 assert.throws(()=>projectNativeSceneSnapshot({...{world:{...world,solar:{soc:NaN}},legacy,farmCore:farm}}),/charge/);
 const forged=structuredClone(valid);forged[20].deliveredWh=2;
 assert.throws(()=>projectNativeSceneSnapshot({world,legacy,farmCore:farm,lastBatch:{ledger:forged}}),/conservation/);
 const wrong=structuredClone(valid);wrong[59].waterRemainingL=5;
 assert.throws(()=>projectNativeSceneSnapshot({world,legacy,farmCore:farm,lastBatch:{ledger:wrong}}),/conservation/);
 assert.equal(JSON.stringify(farm.snapshot()),before);
});
