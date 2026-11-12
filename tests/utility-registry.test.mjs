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
