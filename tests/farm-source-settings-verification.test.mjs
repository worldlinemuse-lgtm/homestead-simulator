import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {FARM_STUDY_FIELDS} from "../src/farm-native-study.mjs";
// Read and instrument the exact bundled source in a throwaway VM. The shipped
// native Farm closure remains byte-for-byte UNMODIFIED.
const original=fs.readFileSync(new URL("../vendor/farm-core.js",import.meta.url),"utf8");
const marker="return Object.freeze({reset,advanceDay,snapshot,setParameter,nativeVisual});";
const inserted=original.replace(marker,
 "globalThis.__sourceSettings = PARAMS.map(row=>[row[0],row[3],row[4]]);\n"+marker);
test("Farm utility controls exactly mirror source/src/core/settings.js keys, defaults and units",()=>{
 assert.notEqual(inserted,original,"Pinned native settings instrumentation anchor unavailable");
 const ctx=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,
  Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN,
  performance:{now:()=>0}});
 vm.runInContext(inserted,ctx,{filename:"vendor/farm-core.js",timeout:30000});
 const all=JSON.parse(JSON.stringify(ctx.__sourceSettings));
 assert.ok(all.length>50,"Original Farm settings table unexpectedly truncated");
 const keys=new Set();
 for(const row of all){
  assert.equal(row.length,3);
  assert.ok(!keys.has(row[0]),"Original Farm source settings key collision "+row[0]);
  keys.add(row[0]);
 }
 for(const field of FARM_STUDY_FIELDS){
  const source=all.find(row=>row[0]===field.key);
  assert.ok(source,"Farm tool attempts a non-source setting: "+field.key);
  assert.equal(field.default,source[1],field.key+" default differs from original Farm");
  assert.equal(field.unit,source[2],field.key+" physical unit differs from original Farm");
 }
});
test("curated management controls remain a strict subset of all original source settings",()=>{
 assert.deepEqual(FARM_STUDY_FIELDS.map(f=>f.key),["mg_does","mg_hens","mg_roosters","mg_set"]);
 for(const field of FARM_STUDY_FIELDS){
  assert.ok(field.max>field.min&&field.default>=field.min&&field.default<=field.max);
  assert.ok(Number.isSafeInteger(field.default));
 }
});
