import test from "node:test";
import assert from "node:assert/strict";
import {UTILITY_REGISTRY_SCHEMA,UTILITY_CAPABILITIES,utilityCapability,assertUtilityRegistry}
  from "../src/utility-registry.mjs";
test("registry declares the executable cross-domain CSV utility with unit and fidelity provenance",()=>{
 assert.equal(UTILITY_REGISTRY_SCHEMA,2);
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

test("native Water preset registry records real executable source and isolated units",()=>{
 const c=utilityCapability("water.preset.native-evaluator");
 assert.ok(c);
 assert.equal(c.kind,"isolated-water-preset");
 assert.equal(c.entrypoint,"evaluateWaterPreset");
 assert.equal(c.ui,"waterPresetRun");
 assert.equal(c.model,"water-source-preset-evaluation");
 assert.equal(c.mutatesModel,false);
 assert.equal(c.advancesClock,false);
 assert.equal(c.isolatedWorldSteps,true);
 assert.equal(c.clockUnit,"s");
 assert.equal(c.sources[0].domain,"water");
 assert.equal(c.sources[0].unit,"L");
 assert.equal(c.sourceRevision,"bd1bfedc8e53d71792f532c5a89d80a33dcf6700");
 assert.equal(c.sourcePath,"source/engine.js");
 assert.deepEqual({...c.inputUnits},{preset:"source-key",seconds:"s",scenario:"index"});
 assert.deepEqual({...c.outputUnits},{produced:"L",spilled:"L",drained:"L",estimatedParts:"USD"});
 assert.equal(assertUtilityRegistry(),true);
});
test("source utility cannot forge revision, physical units or coupled-model identity",()=>{
 const c=utilityCapability("water.preset.native-evaluator");
 for(const field of ["sourceRevision","sourcePath","sourceBlob"]){
  assert.throws(()=>assertUtilityRegistry([{...c,[field]:"forged"}]),/Incomplete capability/);
 }
 assert.throws(()=>assertUtilityRegistry([{...c,inputUnits:{...c.inputUnits,seconds:"h"}}]),/Incomplete capability/);
 assert.throws(()=>assertUtilityRegistry([{...c,outputUnits:{...c.outputUnits,produced:"gal"}}]),/Incomplete capability/);
 assert.throws(()=>assertUtilityRegistry([{...c,isolatedWorldSteps:false}]),/Incomplete capability/);
 assert.throws(()=>assertUtilityRegistry([{...c,mutatesModel:true}]),/Incomplete capability/);
 assert.throws(()=>assertUtilityRegistry([{...c,advancesClock:true}]),/Incomplete capability/);
 assert.throws(()=>assertUtilityRegistry([{...c,model:"experimental-coupled-scenario"}]),/Incomplete capability/);
});

test("directory metadata makes every executable utility findable and differentiates state scope",()=>{
 assert.equal(assertUtilityRegistry(),true);
 for(const category of ["Exports","Water"])
  assert.ok(UTILITY_CAPABILITIES.some(c=>c.category===category),"Missing executable "+category+" utility");
 const comparison=utilityCapability("water.preset.source-comparison");
 assert.ok(comparison,"Original A–H Water comparison is not discoverable");
 assert.equal(comparison.entrypoint,"evaluateWaterPresetComparison");
 assert.equal(comparison.ui,"waterCompareRun");
 assert.equal(comparison.uiSection,"waterPresetUtility");
 const entries=new Set();
 for(const c of UTILITY_CAPABILITIES){
  assert.ok(c.title.trim().length>5);
  assert.ok(c.purpose.trim().length>20);
  assert.ok(c.scope.trim().length>12);
  assert.match(c.uiSection,/^[a-zA-Z][a-zA-Z0-9-]*$/);
  assert.ok(!entries.has(c.id)); entries.add(c.id);
 }
 const water=utilityCapability("water.preset.native-evaluator");
 assert.equal(water.uiSection,"waterPresetUtility");
 assert.match(water.scope,/independent/i);
 assert.match(water.scope,/unchanged/i);
 assert.equal(utilityCapability("cross-domain.resource-ledger.csv").uiSection,"utilityExports");
});

test("native utility directory rejects invalid labels, categories, and UI navigation contracts",()=>{
 const water=utilityCapability("water.preset.native-evaluator");
 for(const field of ["title","purpose","scope","uiSection"]){
  for(const value of [undefined,null,"", " \t ",{},42]){
   assert.throws(()=>assertUtilityRegistry([{...water,[field]:value}]),/Incomplete capability contract/);
  }
 }
 for(const category of [undefined,null,0,"", "fictitious","Solar","Farm","Exports"]){
  assert.throws(()=>assertUtilityRegistry([{...water,category}]),/Incomplete capability contract/);
 }
 for(const uiSection of ["../unsafe","#water","water section"]){
  assert.throws(()=>assertUtilityRegistry([{...water,uiSection}]),/Incomplete capability contract/);
 }
});

test("native Solar battery registry is a real executable and source-pinned isolated study",()=>{
 const battery=utilityCapability("solar.battery.source-diagnostics");
 assert.ok(battery);
 assert.equal(battery.kind,"isolated-solar-battery");
 assert.equal(battery.category,"Solar");
 assert.equal(battery.entrypoint,"evaluateNativeSolarBattery");
 assert.equal(battery.ui,"solarBatteryRun");
 assert.equal(battery.uiSection,"solarBatteryUtility");
 assert.equal(battery.sourcePath,"source/battery.js");
 assert.equal(battery.sourceBlob,"d3190721347fc53991a5d1c7b535dd658c46696f");
 assert.equal(battery.sourceRevision,"871dd8c0ef03a05feb339c9761ead900875f16b5");
 assert.equal(battery.model,"solar-source-battery-study");
 assert.equal(battery.mutatesModel,false);
 assert.equal(battery.advancesClock,false);
 assert.equal(battery.isolatedSourceExecution,true);
 assert.equal(battery.clockUnit,"none");
 assert.equal(battery.sources[0].unit,"A");
 assert.equal(battery.inputUnits.tempC,"degC");
 assert.equal(battery.outputUnits.heatTime,"min");
 assert.equal(assertUtilityRegistry(),true);
 for(const [field,value] of [["sourceBlob","forged"],["sourceRevision","forged"],
  ["sourcePath","wrong"],["mutatesModel",true],["advancesClock",true],
  ["isolatedSourceExecution",false],["clockUnit","h"]]){
  assert.throws(()=>assertUtilityRegistry([{...battery,[field]:value}]),/Incomplete/);
 }
 assert.throws(()=>assertUtilityRegistry([{...battery,sources:[{...battery.sources[0],unit:"W"}]}]),/Incomplete|Invalid/);
 assert.throws(()=>assertUtilityRegistry([{...battery,inputUnits:{...battery.inputUnits,currentA:"kW"}}]),/Incomplete/);
});
