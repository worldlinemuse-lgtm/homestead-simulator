"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,"../src/resource-contract.js"),"utf8"),context);
const {validateTransfer,ledger,auditHour}=context.HomesteadResourceContract;
const sample={schemaVersion:1,resource:"water",unit:"L",quantity:10,
 source:"tank",destination:"livestock",hour:0,evidence:"assumed"};
test("unit-checked resource transfer debits and credits named endpoints",()=>{
 const l=ledger([sample],"water","L");
 assert.equal(l.balances.tank,-10);assert.equal(l.balances.livestock,10);
 assert.equal(l.residual,0);
});
test("reject invalid quantities and dimensions",()=>{
 for(const change of [{quantity:-1},{quantity:Infinity},{quantity:NaN},
   {unit:"Wh"},{resource:"unknown"},{hour:-1},{hour:1.25},{schemaVersion:2},
   {destination:"tank"},{evidence:"certified"},{source:""}])
  assert.throws(()=>validateTransfer({...sample,...change}));
});
test("reject mixing distinct resources and overflowed ledgers",()=>{
 assert.throws(()=>ledger([sample,{...sample,resource:"electricity",unit:"Wh"}],"water","L"));
 assert.throws(()=>ledger([{...sample,quantity:Number.MAX_VALUE},
  {...sample,quantity:Number.MAX_VALUE}],"water","L"),/overflow/);
});
test("zero transfers preserve schema, units and nonnegative bounds",()=>{
 const l=ledger([{...sample,quantity:0}],"water","L");
 assert.equal(l.balances.tank,0);assert.equal(l.residual,0);
 assert.equal(l.schemaVersion,1);
 assert.ok(Object.isFrozen(l.balances));
});
const exampleEnergy={
 pvWh:200,servedBaseWh:80,servedPumpWh:20,
 directBaseWh:60,batteryBaseWh:20,directPumpWh:20,batteryPumpWh:0,
 chargeStoredWh:95,chargeLossWh:5,dischargeLossWh:2,
 curtailedWh:20,batteryWh:1073
};
// Example: PV 200 = direct 60+20 + charge 95+5 + curtailed 20.
// Battery: +95 -20 -2 = +73. Water tank: +12 -7 -2 = +3.
const example={hour:12,energy:exampleEnergy,initialBatteryWh:1000,
 waterBeforeL:60,treatedL:12,consumedL:7,overflowL:2,waterAfterL:63};
test("one-hour independent source/sink balances match actual inventories",()=>{
 const a=auditHour(example);
 assert.equal(a.schemaVersion,1);assert.equal(a.hour,12);
 assert.equal(a.electricity.balances["solar.bus"],0);
 assert.equal(a.electricity.balances["battery.inventory"],73);
 assert.equal(a.water.balances["tank.inventory"],3);
 assert.equal(a.electricity.balances["water.pump"],20);
 assert.equal(a.water.balances["farm.livestock"],7);
 assert.equal(a.transfers.electricity.length,9);
 assert.equal(a.transfers.water.length,3);
 assert.equal(a.transfers.water[0].evidence,"published_model");
});
test("fail closed for tampered transfer amounts and inconsistent inventories",()=>{
 for(const tampered of [
  {...example,energy:{...exampleEnergy,servedPumpWh:0}},
  {...example,energy:{...exampleEnergy,directBaseWh:70}},
  {...example,energy:{...exampleEnergy,chargeStoredWh:90}},
  {...example,energy:{...exampleEnergy,batteryWh:1000}},
  {...example,waterAfterL:64},
  {...example,consumedL:9},
  {...example,overflowL:10},
  {...example,treatedL:NaN}
 ])assert.throws(()=>auditHour(tampered),/mismatch|Invalid/);
});
