"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,performance:require("node:perf_hooks").performance});
for(const p of ["vendor/solar-next-core.js","vendor/water-engine.js","vendor/farm-core.js","src/resource-contract.js","src/coordinator.js"])
 vm.runInContext(fs.readFileSync(path.join(__dirname,"..",p),"utf8"),ctx,{filename:p,timeout:60000});
const Core=ctx.HomesteadCoordinator;
test("live pump pressure has validated nonnegative finite source units and no mutation on rejection",()=>{
 const c=new Core.Coordinator();
 assert.equal(c.snapshot().config.pumpPressurePsi,50);
 for(const invalid of [-1,NaN,Infinity,-Infinity]){
  const before=JSON.stringify(c.snapshot());
  assert.throws(()=>c.configure({pumpPressurePsi:invalid}),/pumpPressurePsi/);
  assert.equal(JSON.stringify(c.snapshot()),before);
 }
 for(const valid of [0,5,35,75,100]){
  assert.equal(c.configure({pumpPressurePsi:valid}).config.pumpPressurePsi,valid);
 }
});
test("coupled live pump sends configured pressure to ORIGINAL hydraulic network and gates it on electricity",()=>{
 const c=new Core.Coordinator({pumpPressurePsi:35});
 const a=c.stepHour();
 assert.equal(a.last.energy.pumpEnabled,true);
 assert.equal(c.water.parts.find(p=>p.type==="pump_sky").params.psi,35);
 assert.ok(Math.abs(a.last.water.waterResidual)<1e-5);
 const off=new Core.Coordinator({pumpPressurePsi:75,batteryStartWh:1000,batteryReserveWh:1000,cloudTransmittance:0,backgroundLoadW:0});
 const b=off.stepHour();
 assert.equal(b.last.energy.pumpEnabled,false);
 assert.equal(off.water.parts.find(p=>p.type==="pump_sky").params.psi,0);
 assert.equal(b.last.energy.servedPumpWh,0);
});
test("pressure adjustment changes source hydraulic inputs without changing battery inventory or scenario clock",()=>{
 const run=pressure=>{
  const c=new Core.Coordinator({pumpPressurePsi:pressure});
  return c.stepHour();
 };
 const a=run(30),b=run(60);
 assert.equal(a.clock.hours,1);assert.equal(b.clock.hours,1);
 assert.equal(a.batteryWh,b.batteryWh);
 assert.equal(a.last.energy.servedPumpWh,b.last.energy.servedPumpWh);
 assert.ok(Math.abs(a.last.energy.residualWh)<1e-5);
 assert.ok(Math.abs(b.last.energy.residualWh)<1e-5);
});
