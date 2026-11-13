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

const finite=(field,value)=>{
 if(typeof value!=="number"||!Number.isFinite(value)||value<0)
  throw new TypeError(field+" must be a nonnegative finite number");
 return value;
};
export function evaluateWaterPreset(engine,{preset="E",seconds=60,scenario=1}={}){
 if(!engine||typeof engine.buildPreset!=="function"||typeof engine.analyze!=="function"||
    typeof engine.step!=="function"||!engine.PRESETS||typeof engine.PRESETS!=="object")
  throw new TypeError("Original Water engine with preset, analysis and step APIs is required");
 if(typeof preset!=="string"||!Object.hasOwn(engine.PRESETS,preset))
  throw new RangeError("Unsupported Water source preset");
 if(!WATER_PRESET_DURATIONS.includes(seconds))
  throw new RangeError("Water preview duration must be 60, 300 or 900 seconds");
 if(!WATER_PRESET_SCENARIOS.includes(scenario))
  throw new RangeError("Water source scenario must be 0, 1 or 2");
 // Each invocation creates a new, private source-engine world. Never pass in the
 // coupled coordinator's own Water world, which is chronologically authoritative.
 const world=engine.buildPreset(preset);
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
 const producedL=finite("producedL",world.produced);
 const spilledL=finite("spilledL",world.spilled);
 const drainedL=finite("drainedL",world.drained);
 const divertedL=finite("divertedL",world.diverted);
 const estimatedPartsUSD=finite("estimatedPartsUSD",study.cost);
 if(!Array.isArray(study.warn)||!study.safety||!Array.isArray(study.safety.gaps))
  throw new Error("Original Water analysis contract is incomplete");
 return Object.freeze({
  schema:1,kind:"isolated-water-source-evaluation",preset,
  name:engine.PRESETS[preset].name,scenario,seconds,
  source:WATER_PRESET_SOURCE,
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
