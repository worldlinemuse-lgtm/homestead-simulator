// SECONDARY: offline, byte-exact Git blob verification of the pinned original
// Solar, Water and Farm source portions used by Homestead. No engine changes.
// Assertions are independent of runtime source comments, network, and metadata.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const gitBlob=text=>{
 const bytes=Buffer.from(text,"utf8");
 return crypto.createHash("sha1")
  .update(Buffer.from("blob "+bytes.length+"\0","utf8"))
  .update(bytes).digest("hex");
};
const farmBlobs=Object.freeze({
 sources:"e1708f1cb3cb63169cdbd272d10144581865982a",
 settings:"6a78d328a260b4d9abe8a6054b2f330e524e523b",
 breeds:"6519ca16bc57bb7e6c5d27564644f3834b5826b5",
 state:"b5f56f71daa8699b1be29c32962a12932c5b8915",
 environment:"c5cdf160ed33f8c88329a0b8d46097ae5ca4210f",
 housing:"0152eed43ba0ca381cc56c53670a93abca137a9d",
 biology:"46cb5cccbfb8283da7f198983f19a5fd8daef34c",
 loads:"1b77f70a18e8d550b482021a7322a370735e0416",
 access:"7427ff168179b75293d8c1fd620317d1e5f9a24d",
 day:"c848b0f8456ad524251384d15f416f26e5ab0f53",
 step:"bc38975969fafebfc8dab3a631d0fb5380ce3062",
 ledger:"a913be02192499f35032173d9d73df150d8eec49"
});
test("source/battery.js is the byte-identical pinned Solar upstream Git blob",()=>{
 const source=read("vendor/solar-battery-native.js");
 assert.equal(gitBlob(source),"d3190721347fc53991a5d1c7b535dd658c46696f");
 assert.match(source,/BATTMODEL/,"native battery model actually present");
});
test("original Water hydraulic source/engine.js is byte-identical inside the export-only adapter",()=>{
 const wrapped=read("vendor/water-engine.js");
 const prefix="/* Vendored source snapshot. Original: worldlinemuse-lgtm/water-purification-simulator/source/engine.js, blob e3e516aa462272d83442acc7904e5592eeb9f6e7. Unmodified scientific functions inside closure. */\nvar HomesteadWaterCore = (function(){\n";
 const suffix="\nreturn Object.freeze({buildPreset,analyze,step,timeTo,timeToGen,solveState,diagnose,cloneWorld,freshWorld,DEF,PRESETS});\n})();\n";
 assert.ok(wrapped.startsWith(prefix),"Water adapter prefix changed; audit source boundary");
 assert.ok(wrapped.endsWith(suffix),"Water adapter suffix changed; audit exported interface");
 const original=wrapped.slice(prefix.length,-suffix.length);
 assert.equal(gitBlob(original),"e3e516aa462272d83442acc7904e5592eeb9f6e7",
  "original native hydraulic source must retain its exact upstream bytes");
});
test("all twelve original Farm core source modules retain independently pinned Git blob bytes",()=>{
 const bundled=read("vendor/farm-core.js");
 assert.ok(bundled.startsWith("/* Vendored unmodified model source from worldlinemuse-lgtm/farm-sim;"),
  "Farm vendoring header unexpectedly changed");
 for(const [name,pinned] of Object.entries(farmBlobs)){
  const marker="// Original: source/src/core/"+name+".js (blob "+pinned+")\n";
  const first=bundled.indexOf(marker);
  assert.ok(first>=0,"missing original "+name+" module marker");
  assert.equal(bundled.indexOf(marker,first+marker.length),-1,
   "duplicated original "+name+" source marker");
  const start=first+marker.length;
  const end=bundled.indexOf(name==="ledger"?
   "\n\n/* Source dependency from farm-sim/source/src/planner/planner.js":
   "\n\n\n// Original: source/src/core/",start);
  assert.ok(end>start,"ambiguous source boundary for "+name);
  const body=bundled.slice(start,end);
  assert.equal(gitBlob(body),pinned,"Farm source byte drift: "+name);
 }
 const annotations=[...bundled.matchAll(/\/\/ Original: source\/src\/core\/[\w-]+\.js \(blob [a-f0-9]{40}\)/g)];
 assert.equal(annotations.length,Object.keys(farmBlobs).length,
  "unreviewed extra or missing source core module");
});
