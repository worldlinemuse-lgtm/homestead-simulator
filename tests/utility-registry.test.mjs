import test from "node:test";
import assert from "node:assert/strict";
import {UTILITY_REGISTRY_SCHEMA,UTILITY_CAPABILITIES,utilityCapability,assertUtilityRegistry}
  from "../src/utility-registry.mjs";
test("registry declares the executable cross-domain CSV utility with unit and fidelity provenance",()=>{
 assert.equal(UTILITY_REGISTRY_SCHEMA,1);
 assert.equal(assertUtilityRegistry(),true);
 const c=utilityCapability("cross-domain.resource-ledger.csv");
 assert.equal(c.entrypoint,"nativeLedgerCsv");
 assert.equal(c.ui,"ledgerCsvBtn");
 assert.equal(c.advancesClock,false);
 assert.equal(c.mutatesModel,false);
 assert.deepEqual(c.sources.map(s=>[s.domain,s.unit]),[["solar","Wh"],["water","L"],["farm","count"]]);
 assert.match(c.sources[0].fidelity,/experimental/);
 assert.equal(utilityCapability("missing"),null);
 assert.ok(Object.isFrozen(UTILITY_CAPABILITIES));
});
test("registry rejects duplicate ids, invalid units and missing contracts",()=>{
 const c=utilityCapability("cross-domain.resource-ledger.csv");
 assert.throws(()=>assertUtilityRegistry([c,c]),/Duplicate/);
 assert.throws(()=>assertUtilityRegistry([{...c,sources:[{...c.sources[0],unit:"kWh"}]}]),/source contract/);
 assert.throws(()=>assertUtilityRegistry([{...c,tests:""}]),/Incomplete/);
});

test("registry rejects missing or forged model identity and duplicate source domains",()=>{
 const c=utilityCapability("cross-domain.resource-ledger.csv");
 for(const model of [undefined,"other-engine",""]){
  assert.throws(()=>assertUtilityRegistry([{...c,model}]),/Incomplete capability contract/);
 }
 assert.throws(()=>assertUtilityRegistry([{...c,sources:[c.sources[0],c.sources[0]]}]),/Duplicate source domain/);
 assert.equal(assertUtilityRegistry([c]),true);
});

test("capability metadata must contain nonblank strings, not merely truthy values",()=>{
 const c=utilityCapability("cross-domain.resource-ledger.csv");
 for(const field of ["kind","implementation","entrypoint","ui","tests","limitations"]){
  for(const value of [undefined,null,0,123,false,[],{}," ","\n\t"]){
   assert.throws(()=>assertUtilityRegistry([{...c,[field]:value}]),/Incomplete capability contract/,
     `${field} must reject ${String(value)}`);
  }
 }
});

test("source metadata requires valid objects with nonblank string interfaces and fidelity",()=>{
 const c=utilityCapability("cross-domain.resource-ledger.csv"),source=c.sources[0];
 for(const invalid of [null,undefined,0,17,false,"solar",[],{}]){
  assert.throws(()=>assertUtilityRegistry([{...c,sources:[invalid]}]),/Invalid source contract/,
    `source must reject ${String(invalid)}`);
 }
 for(const field of ["interface","fidelity"]){
  for(const value of [undefined,null,23,false,[],{}," ","\n"]){
   assert.throws(()=>assertUtilityRegistry([{...c,sources:[{...source,[field]:value}]}]),
     /Invalid source contract/,`${field} must reject ${String(value)}`);
  }
 }
});

test("failed validation does not rewrite user-supplied registry",()=>{
 const c=utilityCapability("cross-domain.resource-ledger.csv");
 const entry={...c,sources:[{...c.sources[0],fidelity:" ",unit:"Wh"}]};
 const before=JSON.stringify(entry);
 assert.throws(()=>assertUtilityRegistry([entry]),/Invalid source contract/);
 assert.equal(JSON.stringify(entry),before);
});
