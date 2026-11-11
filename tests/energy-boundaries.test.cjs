"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,"../src/coordinator.js"),"utf8"),ctx);
const allocate=ctx.HomesteadCoordinator.allocateEnergy;
const cfg={dischargeEfficiency:0.92,chargeEfficiency:0.95,batteryCapacityWh:10000,batteryReserveWh:1000};
const good={pvWh:800,baseWh:300,pumpWh:120,initialBatteryWh:6000,cfg};
test("finite energy transfers conserve input and inventory",()=>{
 const result=allocate(good);
 assert.ok(Math.abs(result.residualWh)<1e-5);
 assert.ok(result.batteryWh>=cfg.batteryReserveWh&&result.batteryWh<=cfg.batteryCapacityWh);
});
test("zero generation and demand remain valid",()=>{
 const r=allocate({...good,pvWh:0,baseWh:0,pumpWh:0});
 assert.equal(r.residualWh,0);
 assert.equal(r.batteryWh,6000);
});
test("reject NaN, infinity and negative energy inputs",()=>{
 for(const key of ["pvWh","baseWh","pumpWh","initialBatteryWh"]){
  for(const value of [NaN,Infinity,-1])assert.throws(()=>allocate({...good,[key]:value}),/finite/);
 }
});
test("reject impossible battery inventories and efficiency coefficients",()=>{
 for(const initialBatteryWh of [999,10001])assert.throws(()=>allocate({...good,initialBatteryWh}),/inventory/);
 for(const key of ["chargeEfficiency","dischargeEfficiency"]){
  for(const value of [0,-0.1,1.1,NaN,Infinity])assert.throws(()=>allocate({...good,cfg:{...cfg,[key]:value}}));
 }
});

test("reject invalid battery reserve, capacity and unknown configuration",()=>{
 for(const badCfg of [
  {...cfg,batteryReserveWh:-1},{...cfg,batteryReserveWh:11000},
  {...cfg,batteryCapacityWh:-1},{...cfg,batteryCapacityWh:NaN},
  {...cfg,batteryCapacityWh:Infinity}
 ])assert.throws(()=>allocate({...good,cfg:badCfg}));
 assert.throws(()=>allocate({...good,cfg:null}),/config/);
});
test("reject overflow before energy arithmetic and refuse nonfinite residual",()=>{
 const huge={...good,pvWh:Number.MAX_VALUE,initialBatteryWh:Number.MAX_VALUE,
  cfg:{...cfg,batteryCapacityWh:Number.MAX_VALUE,batteryReserveWh:0}};
 assert.throws(()=>allocate(huge),/overflow/);
});
test("returns finite, nonnegative hourly ledger fields",()=>{
 for(const [pvWh,baseWh,pumpWh,initialBatteryWh] of [
  [0,300,120,6000],[800,300,120,6000],[800,0,0,6000],[10000,1500,100,9000]
 ]){
  const result=allocate({...good,pvWh,baseWh,pumpWh,initialBatteryWh});
  for(const key of ["batteryWh","servedBaseWh","unservedBaseWh","servedPumpWh",
    "curtailedWh","chargeLossWh","dischargeLossWh","residualWh"])
    assert.ok(Number.isFinite(result[key])&&result[key]>=-1e-8,key);
  assert.ok(result.batteryWh<=cfg.batteryCapacityWh+1e-8);
  assert.ok(Math.abs(result.residualWh)<1e-5);
 }
});
