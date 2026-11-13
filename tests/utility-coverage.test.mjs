import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {UTILITY_CAPABILITIES,assertUtilityRegistry} from "../src/utility-registry.mjs";
const coverage=JSON.parse(fs.readFileSync(new URL("../utility-coverage.json",import.meta.url),"utf8"));
test("coverage audit is explicit about completeness and pins all three original source revisions",()=>{
 assert.equal(coverage.schema,1);
 assert.equal(coverage.coverage,"partial-source-audit");
 assert.match(coverage.scope,/not a comprehensive/i);
 for(const [domain,length] of [["solar",40],["water",40],["farm",40]]){
  assert.equal(coverage.upstreams[domain].revision.length,length);
 }
});
test("each implemented capability has a tested adapter and linked registry contract",()=>{
 assert.equal(assertUtilityRegistry(),true);
 const ids=new Set();
 for(const c of coverage.capabilities){
  assert.ok(typeof c.id==="string"&&!ids.has(c.id));ids.add(c.id);
  assert.ok(["integrated","partial","not-integrated"].includes(c.status));
  assert.ok(Array.isArray(c.gaps)&&c.gaps.length>0);
  assert.ok(["solar","water","farm","cross-domain"].includes(c.domain));
  if(c.status==="integrated"){
   const live=UTILITY_CAPABILITIES.find(x=>x.id===c.id);
   assert.ok(live,"implemented capability missing registry record: "+c.id);
   assert.equal(live.implementation,c.adapter);
   assert.equal(live.ui,c.ui);
   assert.ok(c.tests.length>0);
  }
  if(c.status==="not-integrated"){
   assert.equal(c.adapter,null);
   assert.equal(c.ui,null);
  }
 }
 assert.ok(ids.has("water.preset.native-evaluator"));
 const preview=coverage.capabilities.find(c=>c.id==="water.preset.native-evaluator");
 assert.equal(preview.upstreamRevision,coverage.upstreams.water.revision);
 assert.equal(preview.sourcePath,"source/engine.js");
});
