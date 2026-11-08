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
