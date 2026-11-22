import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
import {createOriginalSolarMinuteStep,ORIGINAL_SOLAR_STEP_BLOB} from "../src/native-solar-minute.mjs";
import {createOriginalWaterMinuteStep} from "../src/native-water-minute.mjs";
import {createOriginalFarmMinuteStep,initialOriginalFarmMinuteState,
  originalFarmDemandPerMinute} from "../src/native-farm-minute.mjs";

const here=path.dirname(fileURLToPath(import.meta.url));
function loadOriginalEngines(){
 const context=vm.createContext({
  console,structuredClone,Date,Math,Map,Set,Number,String,Array,Object,JSON,
  Error,Uint8Array,Float32Array,Float64Array,Int32Array,Infinity,NaN
 });
 for(const file of ["vendor/water-engine.js","vendor/farm-core.js"]){
  vm.runInContext(fs.readFileSync(path.join(here,"..",file),"utf8"),context,
   {filename:file,timeout:60000});
 }
 return {water:context.HomesteadWaterCore,farm:context.HomesteadFarmCore};
}

// Contract-only Solar test double. The production adapter NEVER falls back to
// these equations: it insists on an original SIM supplied by the runtime.
function solarTestDouble(){
 const S={t:0,stats:{served:0},loads:[],live:null,cfg:{},quiet:false,playing:false};
 const sim={
  S,
  grabState(){return {t:S.t,stats:S.stats,loads:S.loads,live:S.live};},
  putState(next){for(const k of ["t","stats","loads","live"])S[k]=structuredClone(next[k]);},
  step(){
   const delivered=Math.min(1,S.loads[0].w/60);
   S.stats.served+=delivered;
   S.live={served:delivered*60,mOut:120,genAC:0,invRun:true,state:"Bulk"};
   S.t=(S.t+1)%(365*1440);
  }
 };
 return sim;
}
test("native Solar adapter calls SIM.step and restores nested singleton state",()=>{
 const sim=solarTestDouble(),before=structuredClone(sim.grabState());
 const callback=createOriginalSolarMinuteStep(sim,{originMinute:0});
 assert.equal(ORIGINAL_SOLAR_STEP_BLOB.length,40);
 const result=callback({minute:0,requestedWh:2,state:before});
 assert.equal(result.deliveredWh,1);
 assert.equal(result.state.t,1);
 assert.equal(result.state.loads[0].w,120);
 assert.equal(result.native.pvControllerWh,2);
 assert.equal(result.native.generatorAcWh,0);
 assert.deepEqual(sim.grabState(),before);
 assert.equal(sim.S.quiet,false);
});
test("Solar native failure and bad chronology cannot mutate the live simulator",()=>{
 const sim=solarTestDouble(),before=structuredClone(sim.grabState());
 const callback=createOriginalSolarMinuteStep(sim);
 assert.throws(()=>callback({minute:10,requestedWh:1,state:before}),/clock mismatch/);
 const originalStep=sim.step;
 sim.step=()=>{sim.S.stats.served=999;throw Error("injected native Solar failure");};
 assert.throws(()=>callback({minute:0,requestedWh:1,state:before}),/injected/);
 assert.deepEqual(sim.grabState(),before);
 assert.equal(sim.S.quiet,false);
 sim.step=originalStep;
});
test("original Water adapter matches direct hydraulic solver substeps",()=>{
 const {water}=loadOriginalEngines();
 const world=water.buildPreset("E");
 const immutable=JSON.stringify(world);
 const adapter=createOriginalWaterMinuteStep(water,{pumpPressurePsi:50});
 const result=adapter({minute:0,requestedWh:2,deliveredWh:2,state:world});
 const direct=water.cloneWorld(world);
 direct.parts.find(p=>p.type==="pump_sky").params.psi=50;
 let elapsed=0,iterations=0;
 while(elapsed<60-1e-7){
  const dt=60-elapsed;
  const response=water.step(direct,dt,1);
  elapsed+=response.dt;
  assert.ok(++iterations<=1000);
 }
 assert.equal(JSON.stringify(result.state),JSON.stringify(direct));
 assert.ok(result.deliveredL>=0);
 assert.ok(Math.abs(result.deliveredL-(direct.produced-world.produced))<1e-7);
 assert.equal(result.native.elapsedSeconds,elapsed);
 assert.equal(JSON.stringify(world),immutable);
});
test("partially unpowered Water pump remains electrically off without fake production",()=>{
 const {water}=loadOriginalEngines(),world=water.buildPreset("E");
 const adapter=createOriginalWaterMinuteStep(water,{pumpPressurePsi:50});
 const result=adapter({minute:0,requestedWh:2,deliveredWh:1,state:world});
 assert.equal(result.native.pumpEnabled,false);
 assert.equal(result.state.parts.find(p=>p.type==="pump_sky").params.psi,0);
 assert.equal(world.parts.find(p=>p.type==="pump_sky").params.psi,50);
 assert.throws(()=>adapter({minute:0,requestedWh:1,deliveredWh:2,state:world}),/exceeds/);
});
test("original Farm demand is equipment-derived and native day advancement is reversible",()=>{
 const {farm}=loadOriginalEngines();
 farm.reset(7);farm.advanceDay();
 const original=JSON.stringify(farm.snapshot());
 const start=initialOriginalFarmMinuteState(farm);
 const demand=originalFarmDemandPerMinute(farm,start.checkpoint);
 assert.ok(demand.waterRequiredL>=0);
 assert.ok(demand.electricityRequestedWh>=0);
 const callback=createOriginalFarmMinuteStep(farm);
 const early=callback({
  minute:0,requestedWh:demand.electricityRequestedWh,
  deliveredWh:demand.electricityRequestedWh,
  waterDeliveredL:demand.waterRequiredL,state:start
 });
 assert.equal(early.native.advancedDay,false);
 assert.equal(JSON.stringify(farm.snapshot()),original);
 const eq=Object.fromEntries(demand.equipment.map(e=>[
  e.id,{requestedWh:e.requestedWh*1439,servedWh:e.requestedWh*1439}
 ]));
 const beforeLast={
  checkpoint:start.checkpoint,
  dayTotals:{
   waterRequestedL:demand.waterRequiredL*1439,
   waterDeliveredL:demand.waterRequiredL*1439,
   electricityRequestedWh:demand.electricityRequestedWh*1439,
   electricityDeliveredWh:demand.electricityRequestedWh*1439,
   equipment:eq
  }
 };
 const last=callback({
  minute:1439,requestedWh:demand.electricityRequestedWh,
  deliveredWh:demand.electricityRequestedWh,
  waterDeliveredL:demand.waterRequiredL,state:beforeLast
 });
 assert.equal(last.native.advancedDay,true);
 assert.equal(last.native.completedDay.supply.waterCoverage,1);
 assert.equal(last.native.completedDay.supply.electricityCoverage,1);
 assert.equal(JSON.stringify(farm.snapshot()),original);
 farm.restoreCheckpoint(last.state.checkpoint);
 assert.equal(farm.snapshot().day,start.checkpoint.day+1);
 farm.restoreCheckpoint(start.checkpoint);
 assert.equal(JSON.stringify(farm.snapshot()),original);
});
