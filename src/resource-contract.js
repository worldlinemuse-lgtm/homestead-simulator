/* Versioned resource-transfer contract for one linked homestead scenario.
 * Pure bookkeeping only: typed records cannot certify physical model accuracy.
 */
(function(root){
"use strict";
const VERSION=1;
const units=Object.freeze({electricity:"Wh",water:"L",feed:"kg"});
const evidenceClasses=Object.freeze(["measured","manufacturer","published_model","assumed","synthetic"]);
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function validateTransfer(t){
 if(!t||typeof t!=="object"||Array.isArray(t))throw new TypeError("Transfer must be an object");
 if(t.schemaVersion!==VERSION)throw new RangeError("Unsupported transfer schemaVersion");
 if(!has(units,t.resource))throw new RangeError("Unknown resource");
 if(t.unit!==units[t.resource])throw new RangeError("Incorrect unit for "+t.resource);
 if(!finite(t.quantity)||t.quantity<0)throw new RangeError("quantity must be finite and nonnegative");
 for(const field of ["source","destination"])
   if(typeof t[field]!=="string"||!t[field].trim())throw new TypeError(field+" must identify equipment");
 if(t.source===t.destination)throw new RangeError("Transfer endpoints must differ");
 if(!Number.isSafeInteger(t.hour)||t.hour<0)throw new RangeError("hour must be a nonnegative integer");
 if(!evidenceClasses.includes(t.evidence))throw new RangeError("Unknown evidence class");
 return Object.freeze({...t});
}
function ledger(transfers,resource,unit){
 if(!has(units,resource)||unit!==units[resource])throw new RangeError("Invalid ledger resource/unit");
 if(!Array.isArray(transfers))throw new TypeError("transfers must be an array");
 const balances=Object.create(null);
 let total=0;
 for(const raw of transfers){
   const t=validateTransfer(raw);
   if(t.resource!==resource)throw new RangeError("Mixed-resource ledger");
   const debit=(balances[t.source]||0)-t.quantity,credit=(balances[t.destination]||0)+t.quantity;
   total+=t.quantity;
   if(!finite(debit)||!finite(credit)||!finite(total))throw new RangeError("Ledger arithmetic overflow");
   balances[t.source]=debit; balances[t.destination]=credit;
 }
 const residual=Object.values(balances).reduce((sum,value)=>sum+value,0);
 if(!finite(residual)||Math.abs(residual)>1e-9*Math.max(1,total))
   throw new Error("Transfer ledger did not close");
 return Object.freeze({schemaVersion:VERSION,resource,unit,
   balances:Object.freeze({...balances}),residual});
}
// Conservation is checked against independently supplied inventory and demand
// figures, not merely by summing a list of self-cancelling debit/credit entries.
function auditHour({hour,energy,initialBatteryWh,waterBeforeL,treatedL,consumedL,
  overflowL,waterAfterL}){
 if(!Number.isSafeInteger(hour)||hour<0)throw new RangeError("hour must be a nonnegative integer");
 if(!energy||typeof energy!=="object")throw new TypeError("Missing energy record");
 const enames=["pvWh","servedBaseWh","servedPumpWh","directBaseWh","batteryBaseWh",
   "directPumpWh","batteryPumpWh","chargeStoredWh","chargeLossWh","dischargeLossWh",
   "curtailedWh","batteryWh"];
 for(const name of enames)
   if(!finite(energy[name])||energy[name]<0)throw new RangeError("Invalid energy "+name);
 for(const [name,value] of Object.entries({initialBatteryWh,waterBeforeL,treatedL,
   consumedL,overflowL,waterAfterL}))
   if(!finite(value)||value<0)throw new RangeError("Invalid transfer quantity "+name);
 const energyTransfers=[],waterTransfers=[];
 const add=(arr,resource,quantity,source,destination,evidence)=>{
   arr.push(validateTransfer({schemaVersion:VERSION,resource,unit:units[resource],
     quantity,source,destination,hour,evidence}));
 };
 add(energyTransfers,"electricity",energy.pvWh,"solar.synthetic_source","solar.bus","synthetic");
 add(energyTransfers,"electricity",energy.directBaseWh,"solar.bus","site.base_load","assumed");
 add(energyTransfers,"electricity",energy.directPumpWh,"solar.bus","water.pump","assumed");
 add(energyTransfers,"electricity",energy.chargeStoredWh,"solar.bus","battery.inventory","assumed");
 add(energyTransfers,"electricity",energy.chargeLossWh,"solar.bus","energy.loss.charge","assumed");
 add(energyTransfers,"electricity",energy.curtailedWh,"solar.bus","solar.curtailed","assumed");
 add(energyTransfers,"electricity",energy.batteryBaseWh,"battery.inventory","site.base_load","assumed");
 add(energyTransfers,"electricity",energy.batteryPumpWh,"battery.inventory","water.pump","assumed");
 add(energyTransfers,"electricity",energy.dischargeLossWh,"battery.inventory","energy.loss.discharge","assumed");
 add(waterTransfers,"water",treatedL,"water.treatment_output","tank.inventory","published_model");
 add(waterTransfers,"water",consumedL,"tank.inventory","farm.livestock","assumed");
 add(waterTransfers,"water",overflowL,"tank.inventory","water.overflow","assumed");
 const electricity=ledger(energyTransfers,"electricity","Wh");
 const water=ledger(waterTransfers,"water","L");
 const check=(record,node,expected)=>{
   const actual=record.balances[node]||0;
   const tolerance=1e-8*Math.max(1,Math.abs(expected));
   if(!finite(expected)||!finite(actual)||Math.abs(actual-expected)>tolerance)
     throw new Error("Resource transfer mismatch "+node+": "+actual+" vs "+expected);
 };
 for(const [node,expected] of [
   ["solar.synthetic_source",-energy.pvWh],["solar.bus",0],
   ["site.base_load",energy.servedBaseWh],["water.pump",energy.servedPumpWh],
   ["battery.inventory",energy.batteryWh-initialBatteryWh],
   ["solar.curtailed",energy.curtailedWh],
   ["energy.loss.charge",energy.chargeLossWh],
   ["energy.loss.discharge",energy.dischargeLossWh]
 ])check(electricity,node,expected);
 for(const [node,expected] of [
   ["water.treatment_output",-treatedL],["tank.inventory",waterAfterL-waterBeforeL],
   ["farm.livestock",consumedL],["water.overflow",overflowL]
 ])check(water,node,expected);
 return Object.freeze({schemaVersion:VERSION,hour,electricity,water,
   transfers:Object.freeze({electricity:Object.freeze(energyTransfers),
     water:Object.freeze(waterTransfers)})});
}
root.HomesteadResourceContract=Object.freeze({VERSION,units,validateTransfer,ledger,auditHour});
})(globalThis);
