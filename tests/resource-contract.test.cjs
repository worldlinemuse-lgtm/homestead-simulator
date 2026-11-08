"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,"../src/resource-contract.js"),"utf8"),context);
const {validateTransfer,ledger}=context.HomesteadResourceContract;
const sample={schemaVersion:1,resource:"water",unit:"L",quantity:10,source:"tank",destination:"livestock",hour:0,evidence:"assumed"};
test("unit-checked transfer balances close",()=>{
 const l=ledger([sample],"water","L");
 assert.equal(l.balances.tank,-10);assert.equal(l.balances.livestock,10);assert.equal(l.residual,0);
});
test("reject invalid quantities and dimensions",()=>{
 for(const change of [{quantity:-1},{quantity:Infinity},{quantity:NaN},{unit:"Wh"},{resource:"unknown"},{hour:-1},{schemaVersion:2},{destination:"tank"},{evidence:"certified"}])
   assert.throws(()=>validateTransfer({...sample,...change}));
});
test("reject mixing distinct resource ledgers",()=>{
 assert.throws(()=>ledger([sample,{...sample,resource:"electricity",unit:"Wh"}],"water","L"));
});
test("zero-quantity transfers are valid, nonnegative and balanced",()=>{
 const l=ledger([{...sample,quantity:0}],"water","L");
 assert.equal(l.residual,0);assert.equal(l.balances.tank,0);
});
