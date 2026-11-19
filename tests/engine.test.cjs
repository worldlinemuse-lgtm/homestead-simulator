"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const path=require("node:path"),test=require("node:test");
const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,performance:require('node:perf_hooks').performance});
for(const p of ["vendor/solar-next-core.js","vendor/solar-battery-native.js","vendor/water-engine.js","vendor/farm-core.js","src/resource-contract.js","src/coordinator.js"]){
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

test("native Farm runtime never mutates biological state or the visual seed model",()=>{
  const farm=ctx.HomesteadFarmCore;
  farm.reset(7);farm.advanceDay();
  const biologicalBefore=JSON.stringify(farm.snapshot());
  const native=farm.nativeVisual;
  assert.equal(typeof native.init,"function");
  const initial=native.init(20261104,9);
  assert.ok(initial.initialized);
  assert.equal(initial.agentCount,farm.snapshot().animals.length);
  assert.ok(native.world().agents instanceof Map);
  const start=new Map([...native.world().agents].map(([id,a])=>[id,[a.x,a.y,a.z]]));
  for(let i=0;i<600;i++)native.frame(1/60,true,9);
  const running=native.stats();
  assert.ok(running.visualSteps>=500,running);
  let moved=0;
  for(const [id,a] of native.world().agents){
    const p=start.get(id);
    if(p&&Math.hypot(a.x-p[0],a.y-p[1])>.025)moved++;
    assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y)&&Number.isFinite(a.z));
  }
  assert.ok(moved>0,"At least one original agent must truly move within 10 seconds");
  assert.ok(running.hops>0,"Original rabbit hop physics must execute within the deterministic 10-second replay");
  assert.equal(JSON.stringify(farm.snapshot()),biologicalBefore,
    "Visual physics must not change biological outcomes");
  const paused=[...native.world().agents].map(([id,a])=>[id,a.x,a.y,a.z]);
  native.frame(1/12,false,9);
  assert.deepEqual([...native.world().agents].map(([id,a])=>[id,a.x,a.y,a.z]),paused,
    "Pause must freeze all native animal positions");
  const fingerprint=JSON.stringify([...native.world().agents].map(([id,a])=>[id,a.x,a.y,a.z]));
  native.init(20261104,9);
  for(let i=0;i<600;i++)native.frame(1/60,true,9);
  assert.equal(JSON.stringify([...native.world().agents].map(([id,a])=>[id,a.x,a.y,a.z])),
    fingerprint,"Identical visual seeds and timestep schedules must replay identically");
  assert.equal(JSON.stringify(farm.snapshot()),biologicalBefore);
});

test("native Farm visual runtime handles malformed inputs, same-day pause and model-day synchronization",()=>{
  const f=ctx.HomesteadFarmCore,n=f.nativeVisual;
  f.reset(11);f.advanceDay();
  assert.throws(()=>n.init(NaN,9),/integer/);
  assert.throws(()=>n.init(20261104,-1),/hour/);
  n.init(20261104,9);
  const current=JSON.stringify(f.snapshot());
  const pts=JSON.stringify([...n.world().agents].map(([id,g])=>[id,g.x,g.y,g.z]));
  n.frame(0,true,9);n.frame(0.1,false,9);
  assert.equal(JSON.stringify([...n.world().agents].map(([id,g])=>[id,g.x,g.y,g.z])),pts);
  assert.throws(()=>n.frame(-1,true,9),/Invalid native Farm frame/);
  assert.throws(()=>n.frame(Infinity,true,9),/Invalid native Farm frame/);
  assert.throws(()=>n.frame(0,false,24),/hour/);
  assert.equal(JSON.stringify(f.snapshot()),current,"native view cannot mutate biology");
  // The biological engine alone is allowed to progress the day and create
  // births/deaths. Native worldSync must reconcile the exact model population.
  for(let i=0;i<25;i++)f.advanceDay();
  n.sync(12);
  const model=f.snapshot();
  assert.equal(n.stats().day,model.day);
  assert.equal(n.stats().agentCount,model.animals.length);
  const present=new Set([...n.world().agents.keys()]);
  assert.equal(present.size,model.animals.length);
  for(const a of model.animals)assert.ok(present.has(a.id));
});


test("native Farm component footprint is read-only, unit-correct and rejects malformed geometry",async()=>{
 const {nativeFarmComponentFootprint,FEET_TO_METRES}=await import("../src/upstream/farm-world/pose-adapter.mjs");
 assert.equal(FEET_TO_METRES,0.3048);
 const origin=Object.freeze({x:23,y:0,z:6});
 const c=Object.freeze({id:"run-1",type:"run",x:40,y:10,w:8,d:12});
 const p=nativeFarmComponentFootprint(c,origin);
 assert.deepEqual({...p},{id:"run-1",type:"run",
   x0:23+40*.3048,x1:23+48*.3048,z0:6+10*.3048,z1:6+22*.3048,unit:"m"});
 assert.ok(Object.isFrozen(p));
 assert.equal(c.x,40);assert.equal(origin.x,23);
 for(const bad of [
   null,{...c,w:0},{...c,d:-1},{...c,x:NaN},
   {...c,y:Infinity},{...c,w:Infinity}
 ])assert.equal(nativeFarmComponentFootprint(bad,origin),null);
 assert.equal(nativeFarmComponentFootprint(c,{...origin,z:NaN}),null);
 assert.equal(nativeFarmComponentFootprint(c,null),null);
 assert.equal(nativeFarmComponentFootprint({...c,x:Number.MAX_VALUE},
   {...origin,x:Number.MAX_VALUE}),null);
});

test("native Farm agent pose rejects coordinate overflow without mutating the original",async()=>{
 const {nativeFarmAgentPose,FEET_TO_METRES}=await import("../src/upstream/farm-world/pose-adapter.mjs");
 const agent=Object.freeze({id:"hen-1",x:2,y:3,z:0,vx:0,vy:0,act:"idle"});
 const origin=Object.freeze({x:12,y:1,z:-4});
 const pose=nativeFarmAgentPose(agent,origin);
 assert.equal(pose.position.x,12+2*FEET_TO_METRES);
 assert.equal(pose.position.z,-4+3*FEET_TO_METRES);
 assert.ok(Object.isFrozen(pose.position));
 assert.equal(agent.x,2);
 assert.throws(()=>nativeFarmAgentPose({...agent,x:Number.MAX_VALUE},
   {...origin,x:Number.MAX_VALUE}),/finite world coordinates/);
 assert.throws(()=>nativeFarmAgentPose({...agent,z:Infinity},origin),/Non-finite native z/);
});

test("configuration edits preserve live inventories and reject conflicting constraints atomically",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator();
 const before=JSON.stringify(c.snapshot());
 for(const bad of [
  {batteryCapacityWh:5999,waterStorageCapacityL:200},
  {batteryCapacityWh:7000,waterStorageCapacityL:59},
  {batteryReserveWh:6001},
  {batteryCapacityWh:5999,waterStorageCapacityL:59,batteryReserveWh:4000},
  {batteryCapacityWh:NaN},
  {waterStorageCapacityL:Infinity}
 ]){
  assert.throws(()=>c.configure(bad),/capacity|reserve|finite|Inconsistent/);
  assert.equal(JSON.stringify(c.snapshot()),before,
    "rejected reconfiguration must not mutate any scenario state");
 }
 const changed=c.configure({batteryCapacityWh:6000,waterStorageCapacityL:60,
   batteryReserveWh:6000});
 assert.equal(changed.batteryWh,6000);
 assert.equal(changed.waterStoredL,60);
 assert.equal(changed.config.batteryCapacityWh,6000);
 assert.equal(changed.config.waterStorageCapacityL,60);
 assert.equal(changed.config.batteryReserveWh,6000);
 // Valid configuration edits must not change cumulative resource totals.
 assert.deepEqual({...changed.cumulative},{...JSON.parse(before).cumulative});
 const reset=c.reset();
 assert.equal(reset.batteryWh,6000);
 assert.equal(reset.waterStoredL,60);
});

test("live reserve enforcement also protects stores after numerical stepping",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({cloudTransmittance:0});
 for(let i=0;i<2;i++)c.stepHour();
 const baseline=JSON.stringify(c.snapshot()),s=c.snapshot();
 assert.ok(s.batteryWh < s.config.batteryStartWh);
 assert.throws(()=>c.configure({batteryReserveWh:s.batteryWh+1}),/reserve/);
 assert.equal(JSON.stringify(c.snapshot()),baseline);
 const updated=c.configure({batteryReserveWh:s.batteryWh,
   waterStorageCapacityL:s.waterStoredL});
 assert.equal(updated.batteryWh,s.batteryWh);
 assert.equal(updated.waterStoredL,s.waterStoredL);
 assert.equal(updated.config.batteryReserveWh,s.batteryWh);
 assert.equal(updated.config.waterStorageCapacityL,s.waterStoredL);
});

test("zero-watt modeled pump cannot create free treated water",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({pumpElectricalW:0,backgroundLoadW:0});
 const before=c.water.produced, previousBattery=c.batteryWh;
 const s=c.stepHour();
 assert.equal(s.last.energy.pumpEnabled,false);
 assert.equal(s.last.energy.servedPumpWh,0);
 assert.equal(s.cumulative.pumpWh,0);
 assert.equal(c.water.parts.find(p=>p.type==="pump_sky").params.psi,0);
 // For the actual E stream -> pump -> pressure-gated RO preset, zero powered
 // head blocks treated output. Do not generalize to all passive systems.
 assert.ok(Math.abs(c.water.produced-before)<1e-8,
  "Unpowered E preset unexpectedly produced treated water; inspect passive head");
 assert.ok(Math.abs(s.last.water.treatedL)<1e-8);
 assert.ok(Math.abs(s.last.energy.residualWh)<1e-5);
 assert.ok(Math.abs(s.last.water.waterResidual)<1e-5);
 assert.ok(Number.isFinite(s.batteryWh)&&s.batteryWh>=0);
 assert.ok(Number.isFinite(previousBattery));
});
test("power allocator refuses zero demand and energy-short tiny powered requests",()=>{
 const api=ctx.HomesteadCoordinator;
 const cfg=api.configuration({batteryCapacityWh:1000,batteryStartWh:0,batteryReserveWh:0});
 const alloc=inputs=>api.allocateEnergy({pvWh:0,baseWh:0,pumpWh:0,
  initialBatteryWh:0,cfg,...inputs});
 for(const pumpWh of [0,Number.EPSILON,1e-9,1,120]){
  const e=alloc({pumpWh});
  assert.equal(e.pumpEnabled,false);
  assert.equal(e.servedPumpWh,0);
  assert.ok(Math.abs(e.residualWh)<1e-5);
 }
 const pvZeroDemand=alloc({pvWh:500,pumpWh:0});
 assert.equal(pvZeroDemand.pumpEnabled,false);
 assert.equal(pvZeroDemand.servedPumpWh,0);
 const enough=alloc({pvWh:150,baseWh:100,pumpWh:50});
 assert.equal(enough.pumpEnabled,true);
 assert.equal(enough.servedPumpWh,50);
 assert.ok(Math.abs(enough.residualWh)<1e-5);
 const insufficient=alloc({pvWh:150,baseWh:100,pumpWh:51});
 assert.equal(insufficient.pumpEnabled,false);
 assert.equal(insufficient.servedPumpWh,0);
 assert.ok(Math.abs(insufficient.residualWh)<1e-5);
});
test("adequately powered pump retains original hydraulic solver integration",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({pumpElectricalW:120,backgroundLoadW:0});
 const s=c.stepHour();
 assert.equal(s.last.energy.pumpEnabled,true);
 assert.ok(Math.abs(s.last.energy.servedPumpWh-120)<1e-8);
 assert.equal(c.water.parts.find(p=>p.type==="pump_sky").params.psi,50);
 assert.ok(Number.isFinite(s.last.water.treatedL) && s.last.water.treatedL>=0);
 assert.ok(Math.abs(s.last.energy.residualWh)<1e-5);
 assert.ok(Math.abs(s.last.water.waterResidual)<1e-5);
});

test("coordinator emits typed per-hour energy/water transfers without changing biology",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator();
 const before=JSON.stringify(c.farm.snapshot());
 const s=c.stepHour(),a=s.last.resourceAudit;
 assert.equal(a.schemaVersion,1);
 assert.equal(a.hour,0);
 assert.equal(a.electricity.resource,"electricity");
 assert.equal(a.electricity.unit,"Wh");
 assert.equal(a.water.resource,"water");
 assert.equal(a.water.unit,"L");
 assert.equal(a.electricity.balances["water.pump"],s.last.energy.servedPumpWh);
 assert.equal(a.electricity.balances["site.base_load"],s.last.energy.servedBaseWh);
 assert.ok(Math.abs(a.water.balances["tank.inventory"]-
   (s.waterStoredL-c.cfg.waterStartL))<1e-8);
 assert.ok(a.transfers.electricity.every(t=>t.hour===0&&t.unit==="Wh"));
 assert.ok(a.transfers.water.every(t=>t.hour===0&&t.unit==="L"));
 assert.equal(JSON.stringify(c.farm.snapshot()),before,"recording must not advance farm biology");
 for(let i=1;i<5;i++){
  const next=c.stepHour(),q=next.last.resourceAudit;
  assert.equal(q.hour,i);
  assert.ok(Math.abs(q.electricity.residual)<1e-5);
  assert.ok(Math.abs(q.water.residual)<1e-5);
 }
});
test("zero-power intervals still reconcile typed zero-pump transfers",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({pumpElectricalW:0,
  cloudTransmittance:0,backgroundLoadW:0});
 const s=c.stepHour(),a=s.last.resourceAudit;
 assert.equal(s.last.energy.servedPumpWh,0);
 assert.equal(a.electricity.balances["water.pump"],0);
 assert.equal(a.water.balances["water.treatment_output"],0);
 assert.ok(Math.abs(a.electricity.residual)<1e-5);
 assert.ok(Math.abs(a.water.residual)<1e-5);
});

test("native Solar battery discharge and absorption affect live hourly dispatch",()=>{
 const Core=ctx.HomesteadCoordinator;
 const common={cloudTransmittance:0,batteryStartWh:6000,batteryReserveWh:1000,
  batteryTemperatureC:20,backgroundLoadW:100,pumpElectricalW:0};
 const lfp=Core.allocateEnergy({pvWh:0,baseWh:1000,pumpWh:0,initialBatteryWh:6000,
   cfg:Core.configuration({...common,batteryChemistry:"lfp"})});
 const agm=Core.allocateEnergy({pvWh:0,baseWh:1000,pumpWh:0,initialBatteryWh:6000,
   cfg:Core.configuration({...common,batteryChemistry:"agm",batteryTemperatureC:-10})});
 assert.equal(lfp.nativeBattery.dischargeMultiplier,1);
 assert.ok(agm.nativeBattery.dischargeMultiplier>1);
 assert.ok(agm.batteryWh<lfp.batteryWh);
 assert.ok(Math.abs(agm.residualWh)<1e-5);
 assert.ok(Math.abs(lfp.residualWh)<1e-5);
 const nearFull=Core.allocateEnergy({pvWh:3000,baseWh:0,pumpWh:0,initialBatteryWh:9500,
  cfg:Core.configuration({...common,batteryStartWh:9500,batteryChemistry:"agm"})});
 assert.equal(nearFull.nativeBattery.chargePhase,"absorption");
 assert.ok(nearFull.nativeBattery.chargeCurrentMultiplier<1);
 assert.ok(nearFull.chargeStoredWh>0);
 assert.ok(Math.abs(nearFull.residualWh)<1e-5);
});

test("3D battery inspector exposes actual native dispatch and conservation telemetry",()=>{
 const ui=fs.readFileSync(path.join(__dirname,"../src/main.js"),"utf8");
 for(const field of ["e.nativeBattery.chemistry","e.nativeBattery.dischargeMultiplier","e.nativeBattery.chargePhase","e.nativeBattery.chargeLimitWh","e.batteryBaseWh+e.batteryPumpWh","e.chargeStoredWh","e.dischargeLossWh+e.chargeLossWh"])
   assert.ok(ui.includes(field),"Missing 3D live telemetry: "+field);
 const c=new ctx.HomesteadCoordinator.Coordinator();
 const s=c.stepHour(),e=s.last.energy;
 assert.equal(e.nativeBattery.source.includes("solar-sandbox/source/battery.js"),true);
 assert.ok(Number.isFinite(e.nativeBattery.dischargeMultiplier));
 assert.ok(Number.isFinite(e.nativeBattery.chargeCurrentMultiplier));
 assert.ok(Math.abs(e.residualWh)<1e-5);
});

test("native battery rejects zero-capacity and invalid direct electrical inputs before state mutation",()=>{
 const Core=ctx.HomesteadCoordinator;
 assert.throws(()=>Core.configuration({batteryCapacityWh:0,batteryStartWh:0,batteryReserveWh:0}),/capacity/i);
 const c=new Core.Coordinator();
 const before=JSON.stringify(c.snapshot());
 assert.throws(()=>c.configure({batteryCapacityWh:0,batteryStartWh:0,batteryReserveWh:0}),/capacity/i);
 assert.equal(JSON.stringify(c.snapshot()),before);
 const cfg=Core.configuration();
 const input={pvWh:500,baseWh:100,pumpWh:0,initialBatteryWh:6000,cfg};
 for(const overrides of [
   {batteryCapacityWh:0,batteryReserveWh:0},
   {batteryBusVoltageV:0},
   {batteryBankAh:0},
   {batteryBulkCurrentLimitA:0},
   {batteryBulkCurrentLimitA:Infinity},
   {batteryBulkCurrentLimitA:1e308,batteryBusVoltageV:1e308}
 ]){
   assert.throws(()=>Core.allocateEnergy({...input,cfg:{...cfg,...overrides}}),
     /capacity|positive|finite|overflow/i);
 }
});

test("native Solar hourly supply is explicitly reconciled to Farm electricity demand",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({
   cloudTransmittance:0,batteryStartWh:1000,batteryReserveWh:1000,
   backgroundLoadW:100,pumpElectricalW:0
 });
 const s=c.stepHour(),e=s.last.energy,f=s.last.farm;
 assert.ok(f.hourlyElectricityDemandWh>=0);
 assert.equal(f.electricityServedWh,0);
 assert.equal(f.electricityDeficitWh,f.hourlyElectricityDemandWh);
 assert.equal(e.servedBaseWh,0);
 assert.equal(s.cumulative.farmElectricityServedWh,0);
 assert.equal(s.cumulative.farmElectricityDeficitWh,f.electricityDeficitWh);
 assert.ok(Math.abs(e.residualWh)<1e-5);
 const powered=new ctx.HomesteadCoordinator.Coordinator({
   cloudTransmittance:0,backgroundLoadW:100,pumpElectricalW:0
 }).stepHour();
 const p=powered.last.farm,energy=powered.last.energy;
 assert.ok(Math.abs(p.electricityServedWh+p.electricityDeficitWh-
   p.hourlyElectricityDemandWh)<1e-7);
 assert.ok(Math.abs(Math.min(100,energy.servedBaseWh)+p.electricityServedWh-
   energy.servedBaseWh)<1e-7);
 assert.ok(Math.abs(powered.cumulative.farmElectricityServedWh-
   p.electricityServedWh)<1e-7);
});

test("native Farm water and energy fulfillment share conservative hourly ledgers",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({
   cloudTransmittance:0,batteryStartWh:1000,batteryReserveWh:1000,
   backgroundLoadW:0,pumpElectricalW:120,waterStartL:0
 });
 for(let hour=0;hour<5;hour++){
   const before=c.snapshot(),after=c.stepHour(),last=after.last;
   assert.ok(Math.abs(last.farm.hourlyWaterDemandL-
     last.farm.waterDeliveredL-last.farm.waterDeficitL)<1e-7);
   assert.equal(last.farm.waterDeliveredL,last.water.consumedL);
   assert.equal(last.farm.waterDeficitL,last.water.shortfallL);
   assert.ok(Math.abs(last.farm.hourlyElectricityDemandWh-
     last.farm.electricityServedWh-last.farm.electricityDeficitWh)<1e-7);
   assert.ok(Math.abs(after.cumulative.farmWaterDeliveredL-
     before.cumulative.farmWaterDeliveredL-last.farm.waterDeliveredL)<1e-7);
   assert.ok(Math.abs(after.cumulative.farmWaterDeficitL-
     before.cumulative.farmWaterDeficitL-last.farm.waterDeficitL)<1e-7);
   assert.equal(last.energy.pumpEnabled,false);
   assert.equal(last.farm.waterDeliveredL,0);
 }
 const replay=()=>{const x=new ctx.HomesteadCoordinator.Coordinator({
   cloudTransmittance:0,batteryStartWh:1000,batteryReserveWh:1000,
   backgroundLoadW:0,pumpElectricalW:120,waterStartL:0
 });for(let i=0;i<5;i++)x.stepHour();return JSON.stringify(x.snapshot());};
 assert.equal(replay(),replay());
});


test("zero configured pump pressure cannot consume energy or generate pressurized water",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({pumpPressurePsi:0,pumpElectricalW:120,backgroundLoadW:0});
 const before=c.water.produced;
 const s=c.stepHour();
 assert.equal(s.last.energy.pumpEnabled,false);
 assert.equal(s.last.energy.servedPumpWh,0);
 assert.equal(s.cumulative.pumpWh,0);
 assert.equal(c.water.parts.find(p=>p.type==="pump_sky").params.psi,0);
 assert.ok(Math.abs(c.water.produced-before)<1e-8);
 assert.ok(Math.abs(s.last.energy.residualWh)<1e-5);
});

test("3D farm summary reports delivered resource fractions, not only theoretical daily demand",()=>{
 const ui=fs.readFileSync(path.join(__dirname,"../src/main.js"),"utf8");
 assert.ok(ui.includes("s.last.farm.waterDeliveredL"));
 assert.ok(ui.includes("s.last.farm.hourlyWaterDemandL"));
 assert.ok(ui.includes("s.last.farm.electricityServedWh"));
 assert.ok(ui.includes("s.last.farm.hourlyElectricityDemandWh"));
});

test("native Solar absorption clock advances only while charging and resets on bulk/float",()=>{
 const core=ctx.HomesteadCoordinator;
 const cfg=core.configuration({batteryChemistry:"lfp",batteryCapacityWh:10000,
   batteryStartWh:9600,batteryReserveWh:0,batteryBankAh:100,batteryBulkCurrentLimitA:30});
 const run=(initialBatteryWh,absorptionMinutes,pvWh)=>core.allocateEnergy({
   pvWh,baseWh:0,pumpWh:0,initialBatteryWh,absorptionMinutes,cfg});
 const first=run(9600,0,1000);
 assert.equal(first.nativeBattery.chargePhase,"absorption");
 assert.equal(first.nextAbsorptionMinutes,60);
 assert.ok(first.chargeStoredWh>0);
 const second=run(9600,60,1000);
 assert.equal(second.nativeBattery.absorptionMinutesBefore,60);
 assert.equal(second.nativeBattery.chargePhase,"float");
 assert.equal(second.chargeStoredWh,0);
 assert.equal(second.nextAbsorptionMinutes,0);
 const bulk=run(5000,60,1000);
 assert.equal(bulk.nativeBattery.chargePhase,"bulk");
 assert.equal(bulk.nextAbsorptionMinutes,0);
 const idle=run(9600,0,0);
 assert.equal(idle.nextAbsorptionMinutes,0);
 assert.throws(()=>run(9600,-1,1000),/absorptionMinutes/);
});

test("native dispatch never enables a partially funded hydraulic pump at sub-epsilon shortages",()=>{
 const core=ctx.HomesteadCoordinator;
 const cfg=core.configuration({batteryStartWh:1000,batteryReserveWh:1000});
 const pumpShort=core.allocateEnergy({pvWh:99.999999999,baseWh:0,pumpWh:100,
   initialBatteryWh:1000,cfg});
 assert.equal(pumpShort.pumpEnabled,false);
 assert.equal(pumpShort.servedPumpWh,0);
 assert.ok(Math.abs(pumpShort.residualWh)<1e-5);
 const baseShort=core.allocateEnergy({pvWh:99.999999999,baseWh:100,pumpWh:1,
   initialBatteryWh:1000,cfg});
 assert.equal(baseShort.pumpEnabled,false);
 assert.equal(baseShort.servedPumpWh,0);
 assert.ok(baseShort.unservedBaseWh>0);
 assert.ok(Math.abs(baseShort.residualWh)<1e-5);
 const exact=core.allocateEnergy({pvWh:100,baseWh:0,pumpWh:100,
   initialBatteryWh:1000,cfg});
 assert.equal(exact.pumpEnabled,true);
 assert.equal(exact.servedPumpWh,100);
 assert.ok(Math.abs(exact.residualWh)<1e-5);
});

test("hourly coupled ledger reconciles all three electrical consumers and cumulative deficits",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({
   cloudTransmittance:0,batteryStartWh:1000,batteryReserveWh:1000,
   backgroundLoadW:50,pumpElectricalW:120,waterStartL:0
 });
 for(let i=0;i<3;i++){
   const before=c.snapshot().cumulative;
   const after=c.stepHour(),e=after.last.energy,loads=after.last.electricalLoads;
   assert.ok(Math.abs(loads.backgroundRequestedWh-loads.backgroundServedWh-loads.backgroundDeficitWh)<1e-7);
   assert.ok(Math.abs(loads.pumpRequestedWh-loads.pumpServedWh-loads.pumpDeficitWh)<1e-7);
   assert.ok(Math.abs(loads.farmRequestedWh-loads.farmServedWh-loads.farmDeficitWh)<1e-7);
   assert.ok(Math.abs(loads.backgroundServedWh+loads.farmServedWh-e.servedBaseWh-e.servedFarmWh)<1e-7);
   assert.equal(loads.pumpServedWh,e.servedPumpWh);
   assert.ok(Math.abs(after.cumulative.pumpElectricityRequestedWh-before.pumpElectricityRequestedWh-loads.pumpRequestedWh)<1e-7);
   assert.ok(Math.abs(after.cumulative.pumpElectricityDeficitWh-before.pumpElectricityDeficitWh-loads.pumpDeficitWh)<1e-7);
   assert.ok(Math.abs(after.cumulative.backgroundElectricityDeficitWh-before.backgroundElectricityDeficitWh-loads.backgroundDeficitWh)<1e-7);
 }
 assert.ok(c.snapshot().cumulative.pumpElectricityDeficitWh>0);
});


test("3D electrical inspector and live HUD expose all three conserved load allocations",()=>{
 const ui=fs.readFileSync(path.join(__dirname,"../src/main.js"),"utf8");
 for(const key of ["backgroundRequestedWh","backgroundServedWh","backgroundDeficitWh",
   "farmRequestedWh","farmServedWh","farmDeficitWh",
   "pumpRequestedWh","pumpServedWh","pumpDeficitWh"]){
   assert.ok(ui.includes("electricalLoads."+key),`Missing live 3D electrical readout: ${key}`);
 }
 const c=new ctx.HomesteadCoordinator.Coordinator({cloudTransmittance:0,
   batteryStartWh:1000,batteryReserveWh:1000,backgroundLoadW:50});
 const s=c.stepHour(),loads=s.last.electricalLoads;
 const requested=loads.backgroundRequestedWh+loads.farmRequestedWh+loads.pumpRequestedWh;
 const served=loads.backgroundServedWh+loads.farmServedWh+loads.pumpServedWh;
 const deficit=loads.backgroundDeficitWh+loads.farmDeficitWh+loads.pumpDeficitWh;
 assert.ok(Math.abs(requested-served-deficit)<1e-7);
 assert.ok(Math.abs(served-s.last.energy.servedBaseWh-s.last.energy.servedPumpWh-s.last.energy.servedFarmWh)<1e-7);
});


test("supplied chronological weather drives original PV core without illustrative sky",()=>{
 const Core=ctx.HomesteadCoordinator;
 const weather=Array.from({length:24},(_,hour)=>({
   irradianceWm2:hour===9?800:0,cellTemperatureC:25
 }));
 const c=new Core.Coordinator({solarHourlyWeather:weather,solarUtilization:1});
 const first=c.stepHour();
 assert.equal(first.last.pv.provenance,"supplied_hourly_weather");
 assert.equal(first.last.pv.irradiance,800);
 assert.ok(first.last.pv.envelopeW>0);
 assert.ok(first.last.energy.pvWh>0);
 const next=c.stepHour();
 assert.equal(next.last.pv.status,"no_sun");
 assert.equal(next.last.pv.provenance,"supplied_hourly_weather");
 assert.equal(next.last.energy.pvWh,0);
 assert.ok(Math.abs(next.last.energy.residualWh)<1e-5);
 const snapshot=c.snapshot();
 snapshot.config.solarHourlyWeather[9].irradianceWm2=0;
 assert.equal(c.snapshot().config.solarHourlyWeather[9].irradianceWm2,800);
});

test("invalid solar hourly series cannot mutate coupled state",()=>{
 const Core=ctx.HomesteadCoordinator;
 const c=new Core.Coordinator();
 const before=JSON.stringify(c.snapshot());
 const valid=Array.from({length:24},()=>({irradianceWm2:500,cellTemperatureC:25}));
 for(const bad of [
   valid.slice(1),
   valid.map((x,i)=>i===0?{...x,irradianceWm2:Infinity}:x),
   valid.map((x,i)=>i===0?{...x,irradianceWm2:-1}:x),
   valid.map((x,i)=>i===0?{...x,cellTemperatureC:90}:x),
   valid.map((x,i)=>i===0?{...x,irradianceWm2:1300}:x)
 ]){
   assert.throws(()=>c.configure({solarHourlyWeather:bad}),
     /solarHourlyWeather|irradiance|temperature/i);
   assert.equal(JSON.stringify(c.snapshot()),before);
 }
});


test("multi-day Solar weather follows calendar days without repeating first-day inputs",()=>{
 const Core=ctx.HomesteadCoordinator;
 const weather=Array.from({length:48},(_,i)=>({
   irradianceWm2:i<24?0:700,cellTemperatureC:25
 }));
 const c=new Core.Coordinator({solarHourlyWeather:weather,solarUtilization:1});
 for(let i=0;i<15;i++){
   const s=c.stepHour();
   assert.equal(s.last.pv.irradiance,0);
   assert.equal(s.last.pv.provenance,"supplied_hourly_weather");
 }
 const next=c.stepHour();
 assert.equal(next.last.hour,0);
 assert.equal(next.last.pv.irradiance,700);
 assert.ok(next.last.energy.pvWh>0);
 assert.ok(Math.abs(next.last.energy.residualWh)<1e-5);
 const replay=()=>{
   const x=new Core.Coordinator({solarHourlyWeather:weather,solarUtilization:1});
   for(let i=0;i<16;i++)x.stepHour();
   return JSON.stringify(x.snapshot());
 };
 assert.equal(replay(),replay());
});

test("weather exhaustion rejects the next step before changing inventories or time",()=>{
 const Core=ctx.HomesteadCoordinator;
 const weather=Array.from({length:24},()=>({irradianceWm2:0,cellTemperatureC:20}));
 const c=new Core.Coordinator({solarHourlyWeather:weather});
 for(let i=0;i<15;i++)c.stepHour();
 const before=JSON.stringify(c.snapshot());
 assert.throws(()=>c.stepHour(),/weather exhausted/i);
 assert.equal(JSON.stringify(c.snapshot()),before);
 const extended=weather.concat(Array.from({length:24},()=>({
   irradianceWm2:600,cellTemperatureC:25
 })));
 c.configure({solarHourlyWeather:extended});
 assert.equal(c.stepHour().last.pv.irradiance,600);
 assert.throws(()=>Core.configuration({solarHourlyWeather:extended.slice(0,25)}),/complete 24-hour days/);
});

test("live 3D Solar weather editor configures the same coupled coordinator",()=>{
 const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"..","src/main.js"),"utf8");
 for(const id of ["solarWeatherJson","solarWeatherApply","solarWeatherClear","solarWeatherStatus"]){
  assert.ok(html.includes('id="'+id+'"'));
  assert.ok(ui.includes('$("'+id+'")'));
 }
 assert.ok(ui.includes("coordinator.configure({solarHourlyWeather:records})"));
 assert.ok(ui.includes("coordinator.configure({solarHourlyWeather:null})"));
});


test("pump has priority over Farm electricity and conservation holds across all consumers",()=>{
 const core=ctx.HomesteadCoordinator;
 const cfg=core.configuration({batteryStartWh:1000,batteryReserveWh:1000,backgroundLoadW:0});
 const e=core.allocateEnergy({pvWh:120,baseWh:0,pumpWh:120,farmWh:50,
   initialBatteryWh:1000,cfg});
 assert.equal(e.pumpEnabled,true);
 assert.equal(e.servedPumpWh,120);
 assert.equal(e.servedFarmWh,0);
 assert.equal(e.unservedFarmWh,50);
 assert.ok(Math.abs(e.residualWh)<1e-5);
 const f=core.allocateEnergy({pvWh:170,baseWh:0,pumpWh:120,farmWh:50,
   initialBatteryWh:1000,cfg});
 assert.equal(f.servedFarmWh,50);
 assert.ok(Math.abs(f.residualWh)<1e-5);
});

test("pump-first dispatch commits actual Farm electricity, not background allocation",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({backgroundLoadW:0,pumpElectricalW:120});
 const result=c.stepHour(),e=result.last.energy;
 assert.ok(e.servedFarmWh>=0);
 assert.ok(Math.abs(result.cumulative.farmElectricityServedWh-e.servedFarmWh)<1e-7);
 assert.ok(Math.abs(result.cumulative.baseWh-e.servedBaseWh)<1e-7);
 assert.ok(Math.abs(result.cumulative.pumpWh-e.servedPumpWh)<1e-7);
 assert.ok(Math.abs(e.residualWh)<1e-5);
});

test("native Farm day boundary preserves actual delivered resource ledger",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({batteryStartWh:1000,batteryReserveWh:1000,cloudTransmittance:0,backgroundLoadW:0});
 for(let i=0;i<15;i++)c.stepHour(); // scenario starts at 09:00; midnight closes first partial day
 const s=c.snapshot();
 assert.equal(s.completedResourceDays.length,1);
 const d=s.completedResourceDays[0];
 assert.equal(d.hours,15);
 assert.equal(d.endingHour,15);
 assert.ok(Math.abs(d.waterRequestedL-d.waterDeliveredL-d.waterDeficitL)<1e-6);
 assert.ok(Math.abs(d.electricityRequestedWh-d.electricityDeliveredWh-d.electricityDeficitWh)<1e-6);
 assert.equal(s.dailyResourceDelivery.hours,0);
 assert.ok(d.electricityDeficitWh>=0&&d.waterDeficitL>=0);
 const before=d.waterDeliveredL;
 s.completedResourceDays[0].waterDeliveredL=-999;
 assert.equal(c.snapshot().completedResourceDays[0].waterDeliveredL,before);
});


test("aggregate energy shortfall includes unpowered Water pump and native Farm load",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({
   cloudTransmittance:0,batteryStartWh:1000,batteryReserveWh:1000,
   backgroundLoadW:50,pumpElectricalW:120,waterStartL:0
 });
 let total=0;
 for(let i=0;i<3;i++){
   const state=c.stepHour(),loads=state.last.electricalLoads;
   const hourly=loads.backgroundDeficitWh+loads.pumpDeficitWh+loads.farmDeficitWh;
   total+=hourly;
   assert.ok(Math.abs(state.cumulative.energyDeficitWh-total)<1e-6);
   assert.ok(state.last.warnings.some(w=>w.includes("Water pump electricity demand was not met")));
   assert.ok(Math.abs(hourly-(loads.backgroundRequestedWh+loads.pumpRequestedWh+loads.farmRequestedWh-
     loads.backgroundServedWh-loads.pumpServedWh-loads.farmServedWh))<1e-6);
 }
 assert.ok(total>=3*120);
});

test("native Farm midnight rejection leaves physical hourly state uncommitted",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator();
 for(let i=0;i<14;i++)c.stepHour();
 const before=JSON.stringify(c.snapshot());
 const native=c.farm;
 try{
   c.farm={...native,advanceDay:()=>{throw new Error("injected Farm midnight failure");}};
   assert.throws(()=>c.stepHour(),/injected Farm midnight failure/);
   assert.equal(JSON.stringify(c.snapshot()),before);
 }finally{
   c.farm=native;
 }
 const resumed=c.stepHour();
 assert.equal(resumed.completedResourceDays.length,1);
 assert.equal(resumed.completedResourceDays[0].hours,15);
 assert.equal(resumed.clock.hours,15);
});


test("native Farm invalid daily demand cannot silently become zero demand",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator();
 const original=c.farmSnapshot;
 const before=JSON.stringify(c.snapshot());
 for(const daily of [null,{waterGal:NaN,kWh:1},{waterGal:1,kWh:NaN},{waterGal:undefined,kWh:1}]){
   c.farmSnapshot={...original,daily};
   assert.throws(()=>c.stepHour(),/Native Farm daily demand unavailable|farm gal|farm kWh/);
   assert.equal(c.hours,0);
   assert.equal(c.waterStoredL,c.cfg.waterStartL);
   assert.equal(c.batteryWh,c.cfg.batteryStartWh);
 }
 c.farmSnapshot=original;
 assert.equal(JSON.stringify(c.snapshot()),before);
 assert.equal(c.stepHour().clock.hours,1);
});


test("Farm operational supply reports measured shortages without invented biology",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({
   batteryStartWh:1000,batteryReserveWh:1000,
   solarHourlyWeather:Array.from({length:48},()=>({irradianceWm2:0,cellTemperatureC:20})),
   waterStartL:0,backgroundLoadW:0
 });
 for(let i=0;i<15;i++)c.stepHour();
 const s=c.snapshot(),d=s.completedResourceDays[0];
 assert.equal(d.hours,15);
 assert.ok(d.waterRequestedL>0);
 // The original Farm can legitimately request zero electrical Wh on a day.
 // Zero demand is satisfied without inventing an electricity shortage.
 assert.ok(Number.isFinite(d.electricityRequestedWh)&&d.electricityRequestedWh>=0);
 assert.equal(d.waterDeliveredL,0);
 assert.equal(d.electricityDeliveredWh,0);
 assert.equal(d.operationalSupply.waterCoverage,0);
 assert.equal(d.operationalSupply.electricityCoverage,
   d.electricityRequestedWh===0?1:0);
 assert.equal(d.operationalSupply.waterSatisfied,false);
 assert.equal(d.operationalSupply.electricitySatisfied,d.electricityRequestedWh===0);
 assert.equal(d.operationalSupply.biologicalEffectsApplied,true);
 assert.equal(s.last.farm.operationalSupply.source,"metered_solar_water_farm_delivery");
 assert.equal(s.farm.day,2,"native Farm advances independently until resource interface exists");
});
test("Farm operational coverage is bounded and cannot overstate supply",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator();
 for(let i=0;i<15;i++)c.stepHour();
 const d=c.snapshot().completedResourceDays[0];
 for(const k of ["waterCoverage","electricityCoverage"])
   assert.ok(Number.isFinite(d.operationalSupply[k])&&d.operationalSupply[k]>=0&&d.operationalSupply[k]<=1);
 assert.equal(d.operationalSupply.waterSatisfied,d.waterDeficitL<=1e-8);
 assert.equal(d.operationalSupply.electricitySatisfied,d.electricityDeficitWh<=1e-8);
});

test("nested public snapshots cannot mutate authoritative Farm or resource histories",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator();
 for(let i=0;i<15;i++)c.stepHour();
 const original=JSON.stringify(c.snapshot());
 const a=c.snapshot();
 a.farm.daily.waterGal=-1000;
 a.completedResourceDays[0].operationalSupply.waterCoverage=-4;
 a.last.energy.nativeBattery.chargePhase="corrupted";
 a.last.resourceAudit && (a.last.resourceAudit.corrupted=true);
 assert.equal(JSON.stringify(c.snapshot()),original);
 const b=c.snapshot();
 assert.ok(b.farm.daily.waterGal>=0);
 assert.ok(b.completedResourceDays[0].operationalSupply.waterCoverage>=0);
 assert.notEqual(b.last.energy.nativeBattery.chargePhase,"corrupted");
 assert.equal(c.stepHour().clock.hours,16);
});

test("native Farm setting commands update the coordinator demand source",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator();
 const day=c.snapshot().farm.day;
 assert.equal(typeof c.setFarmParameter,"function");
 assert.throws(()=>c.setFarmParameter("not_a_farm_setting",1),/Unknown farm parameter/);
 assert.throws(()=>c.setFarmParameter("ck_rank_loss",NaN),/finite/);
 const updated=c.setFarmParameter("ck_rank_loss",20);
 assert.equal(updated.farm.day,day);
 assert.equal(JSON.stringify(updated.farm),JSON.stringify(c.farm.snapshot()),
   "coordinator must expose the refreshed original Farm state");
 assert.ok(Number.isFinite(updated.farm.daily.waterGal));
 assert.ok(Number.isFinite(updated.farm.daily.kWh));
 const next=c.stepHour();
 assert.equal(next.clock.hours,1);
 assert.equal(next.last.farm.dailyDemandWaterL,
   updated.farm.daily.waterGal*3.78541);
 assert.equal(next.last.farm.dailyDemandKWh,updated.farm.daily.kWh);
});

test("native rabbit biology uses measured water coverage and preserves full-supply parity",()=>{
 const f=ctx.HomesteadFarmCore;
 f.reset(29);
 const baseline=f.advanceDay();
 f.reset(29);
 const fullySupplied=f.advanceDay({waterCoverage:1});
 assert.equal(JSON.stringify(fullySupplied),JSON.stringify(baseline),
   "fully supplied integrated Farm must match native standalone behavior");
 f.reset(29);
 const dry=f.advanceDay({waterCoverage:0});
 assert.equal(dry.daily.rFeed,0);
 assert.equal(dry.daily.waterGal>=0,true);
 const rabbits0=baseline.animals.filter(a=>a.sp==="rabbit");
 const rabbitsDry=dry.animals.filter(a=>a.sp==="rabbit");
 assert.equal(rabbits0.length,rabbitsDry.length);
 assert.ok(rabbitsDry.every((a,i)=>a.wt<=rabbits0[i].wt+1e-9),
   "water-limited rabbit growth must not exceed full supply");
 f.reset(29);
 assert.throws(()=>f.advanceDay({waterCoverage:-0.01}),/water coverage/);
 assert.equal(f.snapshot().day,0,"invalid delivery must not advance Farm day");
 f.reset(29);
 assert.throws(()=>f.advanceDay({waterCoverage:NaN}),/water coverage/);
});
test("coupled midnight sends metered shortage into native Farm biology",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({waterStorageCapacityL:0,waterStartL:0});
 let result;
 for(let i=0;i<24;i++)result=c.stepHour();
 const day=result.completedResourceDays[0];
 assert.equal(day.waterDeliveredL,0);
 assert.equal(day.operationalSupply.waterCoverage,0);
 assert.equal(day.operationalSupply.biologicalEffectsApplied,true);
 assert.equal(result.farm.daily.rFeed,0);
});

test("metered partial rabbit water supply scales native intake and preserves replay",()=>{
 const f=ctx.HomesteadFarmCore;
 const run=coverage=>{f.reset(29);return f.advanceDay({waterCoverage:coverage});};
 const full=run(1),half=run(0.5),repeat=run(0.5),dry=run(0);
 assert.equal(JSON.stringify(half),JSON.stringify(repeat),"partial-supply replay must be deterministic");
 assert.ok(Math.abs(half.daily.rFeed-full.daily.rFeed*0.5)<1e-8,
   "rabbit feed ledger must scale with measured supply");
 assert.ok(Math.abs(dry.daily.rFeed)<1e-8);
 const fullR=full.animals.filter(a=>a.sp==="rabbit");
 const halfR=half.animals.filter(a=>a.sp==="rabbit");
 const dryR=dry.animals.filter(a=>a.sp==="rabbit");
 assert.equal(fullR.length,halfR.length);
 assert.equal(fullR.length,dryR.length);
 for(let i=0;i<fullR.length;i++){
   assert.ok(dryR[i].wt<=halfR[i].wt+1e-9);
   assert.ok(halfR[i].wt<=fullR[i].wt+1e-9);
 }
});


test("native chicken laying stops under a full day of zero delivered water",()=>{
 const f=ctx.HomesteadFarmCore;
 const simulate=coverage=>{
  f.reset(29);
  const days=[];
  for(let i=0;i<30;i++)days.push(f.advanceDay({waterCoverage:coverage}));
  return days;
 };
 const full=simulate(1),dry=simulate(0),dryReplay=simulate(0);
 assert.equal(JSON.stringify(dry),JSON.stringify(dryReplay),
   "zero-water chicken and rabbit biological replay must be deterministic");
 assert.ok(full.reduce((sum,day)=>sum+day.daily.eggs,0)>0,
   "seeded source Farm must have laying hens for the control comparison");
 assert.equal(dry.reduce((sum,day)=>sum+day.daily.eggs,0),0,
   "24-hour deprivation must stop native chicken egg production");
});

test("native Farm electrical blackout disables powered equipment without inventing partial outage behavior",()=>{
 const f=ctx.HomesteadFarmCore;
 f.reset(29);
 const baseline=f.advanceDay();
 f.reset(29);
 const full=f.advanceDay({waterCoverage:1,electricityCoverage:1});
 assert.equal(JSON.stringify(full),JSON.stringify(baseline),"full power must retain native source parity");
 f.reset(29);
 const partial=f.advanceDay({waterCoverage:1,electricityCoverage:0.5});
 assert.equal(JSON.stringify(partial),JSON.stringify(baseline),
   "daily aggregate partial power cannot determine equipment outages");
 f.reset(29);
 const dark=f.advanceDay({waterCoverage:1,electricityCoverage:0});
 assert.equal(dark.daily.kWh,0,"full blackout must not consume powered fixture energy");
 f.reset(29);
 assert.equal(JSON.stringify(f.advanceDay({waterCoverage:1,electricityCoverage:0})),JSON.stringify(dark),
   "native blackout must replay deterministically");
 for(const invalid of [-0.01,1.01,NaN,Infinity]){
   f.reset(29);
   assert.throws(()=>f.advanceDay({waterCoverage:1,electricityCoverage:invalid}),/electricity coverage/);
   assert.equal(f.snapshot().day,0,"invalid electricity coverage must not advance biological clock");
 }
});

test("hourly Farm delivery chronology reconciles exact native resource transfers across midnight",()=>{
 const c=new ctx.HomesteadCoordinator.Coordinator({
   batteryStartWh:1000,batteryReserveWh:1000,waterStartL:0,
   solarHourlyWeather:Array.from({length:48},()=>({irradianceWm2:0,cellTemperatureC:20}))
 });
 for(let i=0;i<14;i++){
   const state=c.stepHour();
   assert.equal(state.dailyFarmDeliveryTrace.length,i+1);
   assert.equal(state.dailyFarmDeliveryTrace[i].hourIndex,i);
   assert.equal(state.dailyFarmDeliveryTrace[i].localHour,(9+i)%24);
 }
 const completed=c.stepHour();
 assert.equal(completed.dailyFarmDeliveryTrace.length,0);
 const day=completed.completedResourceDays[0];
 assert.equal(day.hourlyDeliveries.length,15);
 for(const key of ["waterRequestedL","waterDeliveredL","electricityRequestedWh","electricityDeliveredWh"]){
   const total=day.hourlyDeliveries.reduce((sum,h)=>sum+h[key],0);
   assert.ok(Math.abs(total-day[key])<1e-6,key+" hourly conservation");
 }
 const copy=c.snapshot();
 copy.completedResourceDays[0].hourlyDeliveries[0].electricityDeliveredWh=-99;
 assert.ok(c.snapshot().completedResourceDays[0].hourlyDeliveries[0].electricityDeliveredWh>=0);
 const next=c.stepHour();
 assert.equal(next.dailyFarmDeliveryTrace.length,1);
 assert.equal(next.dailyFarmDeliveryTrace[0].hourIndex,15);
});
