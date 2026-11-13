"use strict";
// SECONDARY-owned regression tests. Prove the shared UI coordinator uses the
// ORIGINAL pinned engines; do not replace physics with stand-in calculations.
// Source revisions: Solar 871dd8c0ef03a05feb339c9761ead900875f16b5,
// Water bd1bfedc8e53d71792f532c5a89d80a33dcf6700,
// Farm d6614d7981535fa2b74be86e0c5356af57b56e3b.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,
 JSON,Error,Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,
 performance:require("node:perf_hooks").performance});
for(const file of ["vendor/solar-next-core.js","vendor/water-engine.js",
 "vendor/farm-core.js","src/resource-contract.js","src/coordinator.js"])
 vm.runInContext(fs.readFileSync(path.join(__dirname,"..",file),"utf8"),ctx,
  {filename:file,timeout:60000});
const solar=ctx.SolarNextCore,water=ctx.HomesteadWaterCore,farm=ctx.HomesteadFarmCore;
const Api=ctx.HomesteadCoordinator;
const near=(actual,expected,label,abs=1e-7)=>{
 assert.ok(Number.isFinite(actual)&&Number.isFinite(expected),label+" finite");
 assert.ok(Math.abs(actual-expected)<=abs*Math.max(1,Math.abs(expected)),
  label+": "+actual+" versus "+expected);
};

test("solar daylight calculation delegates exactly to pinned source shadowPv, darkness does not",()=>{
 let calls=[];
 ctx.SolarNextCore={...solar,shadowPv(input){
  calls.push(input);return solar.shadowPv(input);
 }};
 try{
  for(const hour of [0,3,5,6,7,10,12,15,17,18,21,23]){
   const cfg=Api.configuration({cloudTransmittance:0.67,solarUtilization:0.81});
   const before=calls.length;
   const result=Api.solarEnvelopeW(hour,cfg);
   assert.ok(Number.isFinite(result.irradiance)&&result.irradiance>=0);
   assert.ok(Number.isFinite(result.envelopeW)&&result.envelopeW>=0);
   if(result.irradiance<0.01){
    assert.equal(result.status,"no_sun");
    assert.equal(calls.length,before,"dark hours must not fabricate dispatch");
   }else{
    assert.equal(calls.length,before+1,"daylight must invoke original SolarNextCore once");
    const supplied=calls.at(-1);
    assert.equal(supplied.irradianceWm2,result.irradiance);
    assert.equal(supplied.cellTemperatureC,result.cellC);
    assert.equal(supplied.panelId,"lg435");
    assert.equal(supplied.controllerId,"150/70");
    const direct=solar.shadowPv(supplied);
    assert.equal(result.status,direct.status);
    if(direct.status==="estimated")
     near(result.envelopeW,direct.controllerMaximumEnvelopeW,"original Solar PV envelope");
    else assert.equal(result.envelopeW,0);
   }
  }
 }finally{ctx.SolarNextCore=solar;}
});

test("solar fraction is explicitly an assumption, not double-applied to native PV output",()=>{
 const cfg=Api.configuration({cloudTransmittance:0.75,solarUtilization:0.5,
  backgroundLoadW:0,pumpElectricalW:0});
 const envelope=Api.solarEnvelopeW(9,cfg);
 const c=new Api.Coordinator(cfg);
 const hour=c.stepHour();
 assert.equal(hour.clock.hours,1);
 // Hour 09:00 starts the experiment. The one-hour energy transaction equals
 // reference source power TIMES the explicitly documented utilization factor.
 near(hour.last.energy.pvWh,envelope.envelopeW*cfg.solarUtilization,
  "one-hour assumed PV energy Wh");
 near(hour.cumulative.pvWh,hour.last.energy.pvWh,"cumulative PV Wh");
 assert.ok(Math.abs(hour.last.energy.residualWh)<1e-5);
});

test("original Water network step is the source of coupled treated liters for powered and unpowered hours",()=>{
 for(const overrides of [
  {backgroundLoadW:0,pumpElectricalW:120},
  {backgroundLoadW:0,pumpElectricalW:120,batteryStartWh:1000,
   batteryReserveWh:1000,cloudTransmittance:0}
 ]){
  const c=new Api.Coordinator(overrides);
  const direct=water.cloneWorld(c.water);
  const before=direct.produced;
  const s=c.stepHour();
  const nativePump=direct.parts.find(p=>p.type==="pump_sky");
  assert.ok(nativePump,"original Water E network must retain source pump");
  nativePump.params.psi=s.last.energy.pumpEnabled?50:0;
  // Reproduce only the integration's time discretization; all hydraulic
  // computations are delegated unchanged to Water source/engine.js.
  for(let seconds=0;seconds<3600;seconds+=300){
   const step=water.step(direct,300,1);
   assert.equal(step.dt,300,"source integration must advance in 300 s substeps");
  }
  near(s.last.water.treatedL,direct.produced-before,"source-native treated liters");
  near(c.water.produced,direct.produced,"committed native hydraulic world");
  near(s.cumulative.treatedL,s.last.water.treatedL,"treated L total");
  near(s.last.water.waterResidual,0,"water inventory residual L");
  near(s.last.energy.residualWh,0,"electrical ledger residual Wh");
  assert.equal(s.last.resourceAudit.water.unit,"L");
  assert.equal(s.last.resourceAudit.electricity.unit,"Wh");
  assert.equal(s.last.energy.pumpEnabled,s.last.energy.servedPumpWh>0);
 }
});

test("Farm original daily demand is distributed by documented hourly bridge without premature biology steps",()=>{
 const c=new Api.Coordinator({pumpElectricalW:0});
 const initial=c.farm.snapshot();
 const expectedWater=initial.daily.waterGal*3.78541;
 const expectedKWh=initial.daily.kWh;
 assert.ok(Number.isFinite(expectedWater)&&Number.isFinite(expectedKWh));
 for(let i=0;i<14;i++){
  const s=c.stepHour();
  near(s.last.farm.dailyDemandWaterL,expectedWater,"native Farm daily water gallons -> liters");
  near(s.last.farm.dailyDemandKWh,expectedKWh,"native Farm daily kWh");
  assert.equal(s.farm.day,initial.day,"Farm must not advance before midnight");
  assert.equal(s.clock.hourOfDay,(9+i+1)%24);
  assert.equal(s.last.resourceAudit.hour,i);
 }
 const midnight=c.stepHour();
 assert.equal(midnight.clock.hourOfDay,0);
 assert.equal(midnight.clock.hours,15);
 assert.equal(midnight.farm.day,initial.day+1,
  "original Farm advances once at the local calendar boundary");
 assert.equal(midnight.last.resourceAudit.hour,14);
 // The midnight interval itself consumes the previous source day: the newly
 // computed Farm daily ledger must apply beginning with the next hour.
 near(midnight.last.farm.dailyDemandWaterL,expectedWater,"boundary interval Farm demand L/day");
 const next=c.stepHour();
 near(next.last.farm.dailyDemandWaterL,c.farmSnapshot.daily.waterGal*3.78541,
  "following interval new Farm demand L/day");
});

test("isolated native Water utilities do not change coupled Solar, Farm, Water, clock, or inventories",async()=>{
 const {evaluateWaterPreset,evaluateWaterTimeToVolume}=await import("../src/water-preset-utility.mjs");
 const c=new Api.Coordinator();
 for(let i=0;i<3;i++)c.stepHour();
 const before=JSON.stringify(c.snapshot());
 const nativeBefore=JSON.stringify(c.water);
 const farmBefore=JSON.stringify(farm.snapshot());
 const study=evaluateWaterPreset(water,{preset:"E",seconds:300,scenario:1,
  componentEdits:[{key:"p",field:"psi",value:65},{key:"r",field:"drain",value:3}]});
 assert.equal(study.source.path,"source/engine.js");
 assert.equal(study.components.find(v=>v.sourceKey==="p").params.psi,65);
 const time=evaluateWaterTimeToVolume(water,{preset:"H",liters:10,scenario:1});
 assert.equal(time.source.path,"source/engine.js");
 assert.equal(time.maxHours,24);
 assert.equal(JSON.stringify(c.snapshot()),before,"isolated studies must not alter coupled snapshot");
 assert.equal(JSON.stringify(c.water),nativeBefore,"isolated studies must not alter live Water engine");
 assert.equal(JSON.stringify(farm.snapshot()),farmBefore,"isolated studies must not draw Farm RNG");
});
