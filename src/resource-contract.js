/* Versioned inter-engine transfer contract. Standalone and side-effect-free.
 * Units are deliberately not convertible without an explicit conversion.
 * This module validates bookkeeping records; it does not certify physical models.
 */
(function(root){
"use strict";
const VERSION=1;
const units=Object.freeze({electricity:"Wh",water:"L",feed:"kg"});
const finite=(n)=>typeof n==="number"&&Number.isFinite(n);
function validateTransfer(t){
 if(!t||typeof t!=="object"||Array.isArray(t))throw new TypeError("Transfer must be an object");
 if(t.schemaVersion!==VERSION)throw new RangeError("Unsupported transfer schemaVersion");
 if(!Object.prototype.hasOwnProperty.call(units,t.resource))throw new RangeError("Unknown resource");
 if(t.unit!==units[t.resource])throw new RangeError("Incorrect unit for "+t.resource);
 if(!finite(t.quantity)||t.quantity<0)throw new RangeError("quantity must be finite and nonnegative");
 for(const field of ["source","destination"]){
   if(typeof t[field]!=="string"||!t[field].trim())throw new TypeError(field+" must identify equipment");
 }
 if(t.source===t.destination)throw new RangeError("Transfer endpoints must differ");
 if(!Number.isSafeInteger(t.hour)||t.hour<0)throw new RangeError("hour must be a nonnegative integer");
 if(typeof t.evidence!=="string"||!["measured","manufacturer","published_model","assumed","synthetic"].includes(t.evidence))
   throw new RangeError("Unknown evidence class");
 return Object.freeze({...t});
}
function ledger(transfers,resource,unit){
 if(!Object.prototype.hasOwnProperty.call(units,resource)||unit!==units[resource])
   throw new RangeError("Invalid ledger resource/unit");
 if(!Array.isArray(transfers))throw new TypeError("transfers must be an array");
 const balances=Object.create(null);
 let total=0;
 for(const raw of transfers){
   const t=validateTransfer(raw);
   if(t.resource!==resource)throw new RangeError("Mixed-resource ledger");
   balances[t.source]=(balances[t.source]||0)-t.quantity;
   balances[t.destination]=(balances[t.destination]||0)+t.quantity;
   total+=t.quantity;
 }
 const residual=Object.values(balances).reduce((a,b)=>a+b,0);
 const tolerance=1e-9*Math.max(1,total);
 if(Math.abs(residual)>tolerance)throw new Error("Transfer ledger did not close");
 return Object.freeze({schemaVersion:VERSION,resource,unit,balances:Object.freeze({...balances}),residual});
}
root.HomesteadResourceContract=Object.freeze({VERSION,units,validateTransfer,ledger});
})(globalThis);
