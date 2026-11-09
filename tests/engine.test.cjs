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

test("camera and animal interpolation depend on seconds, not frame count",async()=>{
 const {smoothAlpha,frameDeltaSeconds}=await import("../src/visual-motion.mjs");
 const expected=1-Math.exp(-6);
 for(const hz of [10,15,24,30,60,120]){
   let progress=0;
   for(let frame=0;frame<hz;frame++)
     progress+=(1-progress)*smoothAlpha(6,frameDeltaSeconds(1000/hz));
   assert.ok(Math.abs(progress-expected)<1e-12,
     "camera must converge identically at "+hz+" fps: "+progress);
 }
 assert.ok(frameDeltaSeconds(1000/15)>0.055,
   "15 fps must not slow animation by clamping to 55 ms");
 assert.equal(frameDeltaSeconds(1000/4),0.25);
 assert.equal(frameDeltaSeconds(2000),0);
 assert.equal(frameDeltaSeconds(16.7,true),0);
 assert.equal(frameDeltaSeconds(NaN),0);
 assert.equal(frameDeltaSeconds(-20),0);
 assert.equal(smoothAlpha(6,-1),0);
 assert.equal(smoothAlpha(Infinity,1),0);
});
test("visual rabbits and chicks land on pause without modifying biology",async()=>{
 const {gaitPose}=await import("../src/visual-motion.mjs");
 const rabbitPhase=Math.PI/(2*3.4),chickPhase=Math.PI/(2*5.5);
 const airborne=gaitPose(true,true,false,false,rabbitPhase);
 assert.equal(airborne.moving,true);
 assert.ok(airborne.heightM>0.18);
 const paused=gaitPose(false,true,false,false,rabbitPhase);
 assert.equal(paused.moving,false);
 assert.equal(paused.heightM,0);
 for(const p of [gaitPose(true,false,false,false,rabbitPhase),
                 gaitPose(true,true,true,false,rabbitPhase),
                 gaitPose(false,true,false,true,chickPhase)]){
   assert.equal(p.moving,false);assert.equal(p.heightM,0);
 }
 const steppingChick=gaitPose(true,true,false,true,chickPhase);
 assert.equal(steppingChick.moving,true);
 assert.ok(steppingChick.heightM>0);
});

test("chicken feet use alternating distance-based stance and positive terrain swing",async()=>{
 const {chickenFootPhase,chickenSwingLift,CHICKEN_STANCE_FRACTION}=await import("../src/visual-motion.mjs");
 const stride=.26;
 assert.equal(CHICKEN_STANCE_FRACTION,.62);
 // Each leg is half a stride out of phase, so at least one foot is planted.
 for(let n=0;n<=100;n++){
   const d=n*.005;
   const left=chickenFootPhase(d,0,stride,.017);
   const right=chickenFootPhase(d,1,stride,.017);
   assert.ok(left.stance||right.stance,"no stance foot at "+d);
   for(const p of [left,right]){
     assert.ok(p.phase>=0&&p.phase<1);
     assert.ok(chickenSwingLift(p.phase)>=0);
     if(p.stance)assert.equal(chickenSwingLift(p.phase),0);
   }
 }
 const airborne=chickenSwingLift(.81,.07);
 assert.ok(airborne>.069&&airborne<=.07,"swing should lift toe ~7 cm");
 assert.equal(chickenSwingLift(.62,.07),0);
 assert.ok(chickenSwingLift(1,.07)<1e-16);
 const a=chickenFootPhase(.38,0,stride,.007);
 // Frame-rate invariance: phase depends on path metres, not display frames.
 for(const fps of [10,15,30,60,120]){
   let metres=0;
   for(let k=0;k<fps;k++)metres+=.38/fps;
   const b=chickenFootPhase(metres,0,stride,.007);
   assert.ok(Math.abs(a.phase-b.phase)<1e-12);
 }
 for(const args of [[-1,0,.26,0],[0,0,0,0],[0,1,NaN,0],[0,0,.26,-1]])
   assert.throws(()=>chickenFootPhase(...args),RangeError);
 assert.throws(()=>chickenSwingLift(.5,-.02),RangeError);
});
