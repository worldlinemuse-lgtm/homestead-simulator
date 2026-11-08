"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const path=require("node:path"),test=require("node:test");
const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN});
for(const p of ["vendor/solar-next-core.js","vendor/water-engine.js","vendor/farm-core.js","src/coordinator.js"]){
 const code=fs.readFileSync(path.join(__dirname,"..",p),"utf8");
 vm.runInContext(code,ctx,{filename:p,timeout:60000});
}
test("original model source adapters expose callable engines",()=>{
 assert.equal(typeof ctx.SolarNextCore.shadowPv,"function");
 assert.equal(typeof ctx.HomesteadWaterCore.step,"function");
 assert.equal(typeof ctx.HomesteadFarmCore.advanceDay,"function");
});
test("solar reference calculation is a finite published-source scenario envelope",()=>{
 const r=ctx.HomesteadCoordinator.solarEnvelopeW(12,ctx.HomesteadCoordinator.configuration());
 assert.equal(r.status,"estimated");assert.ok(Number.isFinite(r.envelopeW)&&r.envelopeW>0);
});
test("farm state steps its real biological model",()=>{
 const farm=ctx.HomesteadFarmCore;farm.reset(7);const before=farm.snapshot();const after=farm.advanceDay();
 assert.equal(after.day,before.day+1);
 assert.ok(after.daily.waterGal>=0&&after.daily.kWh>=0);
 assert.ok(after.counts.n>0);
});
test("water dynamic solver produces nonnegative treated flow",()=>{
 const w=ctx.HomesteadWaterCore.buildPreset("E");
 const before=w.produced;
 const r=ctx.HomesteadWaterCore.step(w,60,1);
 assert.ok(r.dt>0);assert.ok(w.produced>=before);
});
test("coupled energy and water ledgers close to zero residual",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator();
 for(let i=0;i<27;i++){const s=c.stepHour();assert.ok(Math.abs(s.last.energy.residualWh)<1e-5);assert.ok(Math.abs(s.last.water.waterResidual)<1e-5);assert.ok(s.waterStoredL>=0&&s.waterStoredL<=s.config.waterStorageCapacityL);}
 assert.equal(c.snapshot().clock.hours,27);
 assert.equal(c.snapshot().farm.day,2);
});
test("no pump power implies no pumping charge",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({batteryStartWh:1000,batteryReserveWh:1000,cloudTransmittance:0,backgroundLoadW:0});
 const r=c.stepHour();assert.equal(r.last.energy.pumpEnabled,false);assert.equal(r.last.energy.servedPumpWh,0);
});
test("repeatability for sequential, seeded simulation runs",()=>{
 // Current original Farm model has one singleton state: do NOT interleave two coordinator instances.
 const run=()=>{const c=new ctx.HomesteadCoordinator.Coordinator();for(let i=0;i<25;i++)c.stepHour();return JSON.stringify(c.snapshot());};
 assert.equal(run(),run());
});
