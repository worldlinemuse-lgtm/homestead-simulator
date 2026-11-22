import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
import {createOriginalNativeWorld,createOriginalCoupledHour} from "../src/native-coupled-runtime.mjs";
import {originalFarmDemandPerMinute} from "../src/native-farm-minute.mjs";

const here=path.dirname(fileURLToPath(import.meta.url));
function engines(){
 const context=vm.createContext({
  console,structuredClone,Date,Math,Map,Set,Number,String,Array,Object,JSON,
  Error,Uint8Array,Float32Array,Float64Array,Int32Array,Infinity,NaN
 });
 for(const file of ["vendor/water-engine.js","vendor/farm-core.js"])
  vm.runInContext(fs.readFileSync(path.join(here,"..",file),"utf8"),
    context,{filename:file,timeout:60000});
 return {water:context.HomesteadWaterCore,farm:context.HomesteadFarmCore};
}

// Wiring-test stand-in only. Production requires original Solar window.SIM.
function meteredSolarHarness(){
 const S={cfg:{},quiet:false,playing:false,t:0,stats:{served:0},loads:[],live:null};
 return {
  S,
  grabState(){return {t:S.t,stats:S.stats,loads:S.loads,live:S.live};},
  putState(s){for(const k of ["t","stats","loads","live"])S[k]=structuredClone(s[k]);},
  step(){
   const watts=S.loads[0].w;
   S.stats.served+=watts/60;
   S.live={served:watts,mOut:watts,genAC:0,invRun:true,state:"Bulk"};
   S.t=(S.t+1)%(365*1440);
  }
 };
}
test("native Water and Farm run in one authoritative minute ledger, Solar boundary is metered",()=>{
 const {water,farm}=engines();
 farm.reset(7);farm.advanceDay();
 const farmBefore=JSON.stringify(farm.snapshot());
 const solar= meteredSolarHarness();
 const sourceWater=water.buildPreset("E");
 const sourceWaterBefore=JSON.stringify(sourceWater);
 const start=createOriginalNativeWorld({
  solarSim:solar,waterCore:water,farmCore:farm,waterWorld:sourceWater,
  storedWaterL:0,waterCapacityL:250
 });
 const nativeDemand=originalFarmDemandPerMinute(farm,start.farm.checkpoint);
 const hour=createOriginalCoupledHour({
  solarSim:solar,waterCore:water,farmCore:farm,
  backgroundLoadW:60,pumpLoadW:120,pumpPressurePsi:50,
  solarOriginMinute:0
 });
 const result=hour({clockMinute:0,state:start});
 assert.equal(result.ledger.length,60);
 assert.equal(result.state.clockMinute,60);
 assert.equal(result.state.solar.t,60);
 assert.equal(result.state.farm.checkpoint.day,start.farm.checkpoint.day);
 assert.equal(result.totals.energyRequestedWh,60*(1+2+nativeDemand.electricityRequestedWh));
 assert.ok(Math.abs(result.totals.energyRequestedWh-result.totals.energyDeliveredWh)<1e-5);
 assert.ok(Math.abs(result.state.storedWaterL+result.totals.waterConsumedL+
  result.waterOverflowL-result.totals.waterProducedL)<1e-5);
 assert.equal(JSON.stringify(sourceWater),sourceWaterBefore);
 assert.equal(JSON.stringify(farm.snapshot()),farmBefore);
 assert.equal(solar.S.t,0);
 assert.equal(solar.S.stats.served,0);
 assert.equal(start.clockMinute,0);
 assert.equal(start.solar.t,0);
 assert.equal(result.demandSource.farm,"original_farm_equipment_snapshot");
 assert.ok(result.demandSource.farmEquipment.length>=0);
});
