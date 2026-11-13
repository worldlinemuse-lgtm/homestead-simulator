import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {evaluateWaterPreset,waterPresetNativeControls} from "../src/water-preset-utility.mjs";

const context=vm.createContext({console,Date,Math,Map,Set,Number,String,Array,Object,JSON,Error,
 Uint8Array,Float64Array,Float32Array,Int32Array,Infinity,NaN});
vm.runInContext(fs.readFileSync(new URL("../vendor/water-engine.js",import.meta.url),"utf8"),context,
 {filename:"vendor/water-engine.js",timeout:30000});
const engine=context.HomesteadWaterCore;
function direct(preset,edits,seconds=60,scenario=1){
 const world=engine.buildPreset(preset),keys=Object.keys(engine.PRESETS[preset].parts);
 for(const edit of edits){
  const part=world.parts[keys.indexOf(edit.key)];
  part.params[edit.field]=edit.value;
  if(edit.field==="init")part.rt.vol=engine.DEF[part.type].capL*edit.value;
 }
 const study=engine.analyze(world);let elapsed=0;
 while(elapsed<seconds-1e-8){
  const next=engine.step(world,Math.min(60,seconds-elapsed),scenario);elapsed+=next.dt;
 }
 return {world,study};
}
test("native Water control catalog uses source keys and original parameter defaults",()=>{
 const e=waterPresetNativeControls(engine,"E");
 assert.deepEqual(e.map(x=>[x.key,x.type,x.field,x.value]),
  [["p","pump_sky","psi",50],["r","ro","drain",2]]);
 const d=waterPresetNativeControls(engine,"D");
 assert.ok(d.some(x=>x.key==="b"&&x.field==="init"&&x.value===1));
 assert.ok(d.some(x=>x.key==="b"&&x.field==="stand"&&x.value===false));
 assert.ok(Object.isFrozen(e)&&Object.isFrozen(e[0]));
});
test("edited pump pressure and RO drain retain original-engine numerical parity",()=>{
 const edits=[{key:"p",field:"psi",value:40},{key:"r",field:"drain",value:3}];
 const raw=direct("E",edits,300,1);
 const value=evaluateWaterPreset(engine,{preset:"E",seconds:300,scenario:1,componentEdits:edits});
 for(const [field,rawValue] of [["producedL",raw.world.produced],["drainedL",raw.world.drained],
  ["spilledL",raw.world.spilled],["divertedL",raw.world.diverted],["estimatedPartsUSD",raw.study.cost]])
  assert.ok(Math.abs(value[field]-rawValue)<1e-8,field);
 assert.equal(value.components.find(x=>x.sourceKey==="p").params.psi,40);
 assert.equal(value.components.find(x=>x.sourceKey==="r").params.drain,3);
 assert.deepEqual(value,evaluateWaterPreset(engine,{preset:"E",seconds:300,scenario:1,componentEdits:edits}));
});
test("native initial fill and raised stand stay inside a private preset world",()=>{
 const live=engine.buildPreset("D"),unchanged=JSON.stringify(live);
 const edits=[{key:"b",field:"init",value:0},{key:"b",field:"stand",value:true}];
 const raw=direct("D",edits),value=evaluateWaterPreset(engine,{preset:"D",componentEdits:edits});
 assert.equal(value.components.find(x=>x.sourceKey==="b").volumeL,
  raw.world.parts[Object.keys(engine.PRESETS.D.parts).indexOf("b")].rt.vol);
 assert.equal(value.producedL,raw.world.produced);
 assert.equal(JSON.stringify(live),unchanged);
 assert.equal(value.components.find(x=>x.sourceKey==="b").params.stand,true);
});
test("native edits reject forged keys, duplicates, malformed and nonfinite values",()=>{
 const invalid=[
 null,{},[{key:"p",field:"psi",value:NaN}],[{key:"p",field:"psi",value:Infinity}],
 [{key:"p",field:"psi",value:"40"}],[{key:"p",field:"psi",value:-1}],
 [{key:"p",field:"psi",value:101}],[{key:"p",field:"init",value:1}],
 [{key:"wrong",field:"psi",value:40}],
 [{key:"p",field:"psi",value:40},{key:"p",field:"psi",value:60}],
 [{key:"p",field:"psi",value:40,extra:"forged"}]
 ];
 for(const edits of invalid)
  assert.throws(()=>evaluateWaterPreset(engine,{preset:"E",componentEdits:edits}),
   /(component edits|Malformed|Unknown|Duplicate|Invalid)/,JSON.stringify(edits));
 for(const value of [-0.5,0.5,2,NaN,"1"])
  assert.throws(()=>evaluateWaterPreset(engine,{preset:"D",componentEdits:[{key:"b",field:"init",value}]}));
 assert.throws(()=>evaluateWaterPreset(engine,{preset:"D",componentEdits:[{key:"b",field:"stand",value:1}]}));
});
