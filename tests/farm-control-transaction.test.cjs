"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const ctx=vm.createContext({console,structuredClone,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,performance:require("node:perf_hooks").performance});
for(const p of ["vendor/solar-next-core.js","vendor/solar-battery-native.js","vendor/water-engine.js","vendor/farm-core.js","src/resource-contract.js","src/coordinator.js"])
  vm.runInContext(fs.readFileSync(path.join(__dirname,"..",p),"utf8"),ctx,{filename:p,timeout:60000});
for(const command of ["setFarmParameter","setFarmEquipmentParameter"]){
  test(command+" rolls back native biological mutation on failure",()=>{
    const coordinator=new ctx.HomesteadCoordinator.Coordinator();
    const native=coordinator.farm;
    const before=JSON.stringify(native.snapshot());
    const publicBefore=JSON.stringify(coordinator.snapshot());
    coordinator.farm=Object.assign(Object.create(native),{
      [command==="setFarmParameter"?"setParameter":"setEquipmentParameter"](){
        native.reset(999);
        throw new Error("injected native command failure");
      },
      checkpoint:()=>native.checkpoint(),
      restoreCheckpoint:state=>native.restoreCheckpoint(state),
      snapshot:()=>native.snapshot()
    });
    assert.throws(()=>command==="setFarmParameter"
      ?coordinator.setFarmParameter("water",1)
      :coordinator.setFarmEquipmentParameter("fixture","watts",1),/injected native command failure/);
    assert.equal(JSON.stringify(native.snapshot()),before);
    assert.equal(JSON.stringify(coordinator.snapshot()),publicBefore);
  });
}
