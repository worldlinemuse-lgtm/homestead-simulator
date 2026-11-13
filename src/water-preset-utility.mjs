// Source-native Water engineering preview. Does not touch the shared Coordinator water world.
// The Water engine is vendored unchanged from source/engine.js; all computations are delegated.
export const WATER_PRESET_SOURCE=Object.freeze({
 repository:"worldlinemuse-lgtm/water-purification-simulator",
 commit:"bd1bfedc8e53d71792f532c5a89d80a33dcf6700",
 path:"source/engine.js",
 sourceBlob:"e3e516aa462272d83442acc7904e5592eeb9f6e7"
});
export const WATER_PRESET_DURATIONS=Object.freeze([60,300,900]);
export const WATER_PRESET_SCENARIOS=Object.freeze([0,1,2]);


const WATER_NATIVE_FIELD_RULES=Object.freeze({
 pump_sky:[["psi","Pump pressure","psi",0,100,5]],
 ro:[["drain","RO reject-water ratio","L discarded / L produced",0,10,0.5]],
 barrel50:[["init","Initial tank fill","0 empty / 1 full",0,1,1],["stand","Raised source stand","boolean",null,null,null]],
 bucket:[["init","Initial bucket fill","0 empty / 1 full",0,1,1]]
});
// Catalog the original component inputs; never replace their solver equations.
export function waterPresetNativeControls(engine,preset){
 if(!engine||!engine.PRESETS||!engine.DEF||typeof preset!=="string"||
    !Object.hasOwn(engine.PRESETS,preset))throw new RangeError("Unsupported Water source preset");
 const controls=[];
 for(const [key,component] of Object.entries(engine.PRESETS[preset].parts)){
  const definition=engine.DEF[component.type];
  for(const [field,label,unit,min,max,step] of WATER_NATIVE_FIELD_RULES[component.type]||[]){
   if(!definition||!Object.hasOwn(definition.params,field))
    throw new TypeError("Original Water component parameter contract unavailable");
   const supplied=component.o?.params;
   const value=supplied&&Object.hasOwn(supplied,field)?supplied[field]:definition.params[field];
   controls.push(Object.freeze({key,type:component.type,name:definition.name,field,label,
    unit,min,max,step,kind:unit==="boolean"?"boolean":"number",value}));
  }
 }
 return Object.freeze(controls);
}
function validateWaterNativeEdits(controls,edits){
 if(!Array.isArray(edits)||edits.length>controls.length)
  throw new TypeError("Water component edits must be an array of supported controls");
 const validated=[],seen=new Set();
 for(const edit of edits){
  if(!edit||typeof edit!=="object"||Array.isArray(edit)||
     Object.keys(edit).sort().join(",")!=="field,key,value")
   throw new TypeError("Malformed Water source component edit");
  const control=controls.find(c=>c.key===edit.key&&c.field===edit.field);
  if(!control)throw new RangeError("Unknown Water source component field");
  const identity=control.key+":"+control.field;
  if(seen.has(identity))throw new RangeError("Duplicate Water source component field");
  seen.add(identity);
  const value=edit.value;
  if(control.kind==="boolean"?typeof value!=="boolean":
    typeof value!=="number"||!Number.isFinite(value)||value<control.min||
    value>control.max||(control.field==="init"&&!Number.isInteger(value)))
   throw new RangeError("Invalid Water source component value");
  validated.push(Object.freeze({key:control.key,field:control.field,value}));
 }
 return Object.freeze(validated);
}

const finite=(field,value)=>{
 if(typeof value!=="number"||!Number.isFinite(value)||value<0)
  throw new TypeError(field+" must be a nonnegative finite number");
 return value;
};
function buildEditedSourceWorld(engine,preset,componentEdits){
 if(!engine||typeof engine.buildPreset!=="function"||!engine.PRESETS||
    typeof preset!=="string"||!Object.hasOwn(engine.PRESETS,preset))
  throw new TypeError("Original Water preset engine is required");
 const controls=waterPresetNativeControls(engine,preset);
 const edits=validateWaterNativeEdits(controls,componentEdits);
 const world=engine.buildPreset(preset);
 const keys=Object.keys(engine.PRESETS[preset].parts);
 // Original buildPreset preserves keyed insertion order, but parts carry
 // no source key. Verify source-defined coordinates/elevation to prevent
 // silently assigning two same-type components to the wrong source key.
 if(!Array.isArray(world.parts)||world.parts.length!==keys.length)
  throw new Error("Original Water source component identity mapping mismatch");
 for(let i=0;i<keys.length;i++){
  const spec=engine.PRESETS[preset].parts[keys[i]],part=world.parts[i];
  if(!part||part.type!==spec.type||part.x!==spec.x||part.z!==spec.z||
     (spec.o?.elev!==undefined&&part.elev!==spec.o.elev))
   throw new Error("Original Water source component identity mapping mismatch");
 }
 for(const edit of edits){
  const index=keys.indexOf(edit.key),part=world.parts[index];
  if(index<0||!part||part.type!==engine.PRESETS[preset].parts[edit.key]?.type)
   throw new Error("Original Water preset component identity mismatch");
  part.params[edit.field]=edit.value;
  if(edit.field==="init")part.rt.vol=engine.DEF[part.type].capL*edit.value;
 }
 return {world,keys,edits};
}
export function evaluateWaterTimeToVolume(engine,{preset="E",liters=10,scenario=1,componentEdits=[]}={}){
 if(!engine||typeof engine.timeTo!=="function")
  throw new TypeError("Original Water timeTo engine API is required");
 if(typeof liters!=="number"||!Number.isFinite(liters)||liters<=0||liters>10000)
  throw new RangeError("Target volume must be finite and between 0 and 10000 L");
 if(!WATER_PRESET_SCENARIOS.includes(scenario))
  throw new RangeError("Water source scenario must be 0, 1 or 2");
 // Upstream timeTo uses a 0.01 L absolute completion tolerance; smaller
 // targets can falsely succeed with zero physical outlet production.
 if(liters<=0.01)throw new RangeError("Target volume must exceed original solver 0.01 L resolution");
 const {world,edits}=buildEditedSourceWorld(engine,preset,componentEdits);
 const result=engine.timeTo(world,liters,scenario,24);
 if(!result||!(result.min===null||(typeof result.min==="number"&&
    Number.isFinite(result.min)&&result.min>=0&&result.min<=24*60))||
    !Number.isSafeInteger(result.steps)||result.steps<0||
    (result.min===null&&(typeof result.why!=="string"||!result.why.trim())))
  throw new Error("Original Water time-to-volume result is invalid");
 return Object.freeze({schema:1,kind:"isolated-water-time-to-volume",
  preset,liters,scenario,componentEdits:edits,source:WATER_PRESET_SOURCE,
  minutes:result.min,reason:result.min===null?result.why:null,solverSteps:result.steps,
  maxHours:24,assumptions:"Original Water hydraulic estimate over at most 24 modeled hours. Not a guarantee of safe water, sustained yield or electrical supply. Live Homestead state unchanged."});
}
export function evaluateWaterPreset(engine,{preset="E",seconds=60,scenario=1,componentEdits=[]}={}){
 if(!engine||typeof engine.buildPreset!=="function"||typeof engine.analyze!=="function"||
    typeof engine.step!=="function"||!engine.PRESETS||typeof engine.PRESETS!=="object")
  throw new TypeError("Original Water engine with preset, analysis and step APIs is required");
 if(typeof preset!=="string"||!Object.hasOwn(engine.PRESETS,preset))
  throw new RangeError("Unsupported Water source preset");
 if(!WATER_PRESET_DURATIONS.includes(seconds))
  throw new RangeError("Water preview duration must be 60, 300 or 900 seconds");
 if(!WATER_PRESET_SCENARIOS.includes(scenario))
  throw new RangeError("Water source scenario must be 0, 1 or 2");
 const {world,keys,edits}=buildEditedSourceWorld(engine,preset,componentEdits);
 const study=engine.analyze(world); // original engine attaches caches only to this world
 let elapsed=0,iterations=0,last=null;
 while(elapsed<seconds-1e-8){
  if(++iterations>1000)throw new Error("Water preview failed to advance within step budget");
  const remaining=Math.min(60,seconds-elapsed);
  const next=engine.step(world,remaining,scenario);
  if(!next||!Number.isFinite(next.dt)||next.dt<=0||next.dt>remaining+1e-8)
   throw new Error("Original Water solver returned an invalid timestep");
  elapsed+=next.dt;last=next;
 }
 if(Math.abs(world.t-seconds)>1e-6||Math.abs(elapsed-seconds)>1e-6)
  throw new Error("Water preview clock failed conservation check");
 // Preserve source-native component identity and post-step runtime measurements.
 // These are isolated engineering-study components, never coupled-world objects.
 const components=Object.freeze(world.parts.map((part,index)=>Object.freeze({
  sourceKey:keys[index],
  type:part.type,
  name:String(engine.DEF?.[part.type]?.name||part.type),
  kind:String(engine.DEF?.[part.type]?.kind||"unknown"),
  params:Object.freeze(JSON.parse(JSON.stringify(part.params))),
  volumeL:finite("component volumeL",part.rt.vol),
  throughputL:finite("component throughputL",part.rt.thru),
  flowLpm:finite("component flowLpm",part.rt.Q)
 })));
 const producedL=finite("producedL",world.produced);
 const spilledL=finite("spilledL",world.spilled);
 const drainedL=finite("drainedL",world.drained);
 const divertedL=finite("divertedL",world.diverted);
 const estimatedPartsUSD=finite("estimatedPartsUSD",study.cost);
 if(!Array.isArray(study.warn)||!study.safety||!Array.isArray(study.safety.gaps))
  throw new Error("Original Water analysis contract is incomplete");
 return Object.freeze({
  schema:1,kind:"isolated-water-source-evaluation",preset,componentEdits:edits,
  name:engine.PRESETS[preset].name,scenario,seconds,
  source:WATER_PRESET_SOURCE,components,
  producedL,spilledL,drainedL,divertedL,estimatedPartsUSD,
  unpricedConnections:finite("unpricedConnections",study.unpriced),
  safetyScreen:study.safety.title,
  treatmentGaps:Object.freeze([...study.safety.gaps]),
  chemicalGaps:Object.freeze([...(study.safety.chemGap||[])]),
  warnings:Object.freeze([...study.warn]),
  noFlowReason:last?.dg?.why||null,
  assumptions:"Source model preset only: pump energy availability, rain input, manufacturer accuracy and potability are not verified. No resource transfer into Homestead."
 });
}


// Reuse the same source-native A–H calculations for a comparative engineering study.
// No simplified flow estimate, shared-world mutation, or independent physics.
export const WATER_SOURCE_PRESET_IDS=Object.freeze(["A","B","C","D","E","F","G","H"]);
export function evaluateWaterPresetComparison(engine,{seconds=60,scenario=1}={}){
 // Validate the shared request before any source-world construction.
 if(!WATER_PRESET_DURATIONS.includes(seconds))
  throw new RangeError("Water preview duration must be 60, 300 or 900 seconds");
 if(!WATER_PRESET_SCENARIOS.includes(scenario))
  throw new RangeError("Water source scenario must be 0, 1 or 2");
 if(!engine||!engine.PRESETS||WATER_SOURCE_PRESET_IDS.some(id=>!Object.hasOwn(engine.PRESETS,id)))
  throw new TypeError("Original Water engine must provide all eight source designs");
 // evaluateWaterPreset creates a new private original world for every design.
 // Returning each unmodified source result preserves diagnostics and provenance.
 const results=Object.freeze(WATER_SOURCE_PRESET_IDS.map(preset=>
  evaluateWaterPreset(engine,{preset,seconds,scenario})));
 return Object.freeze({
  schema:1,kind:"isolated-water-source-comparison",seconds,scenario,
  source:WATER_PRESET_SOURCE,results,
  assumptions:"The eight original source designs are evaluated independently using identical scenario and duration. Not a certified field yield, relative ranking, or live Homestead transaction."
 });
}
