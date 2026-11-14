/* Isolated Farm STUDY execution (not an alternate biology engine).
 * A fresh worker loads the exact original vendored Farm closure on every run.
 * Source: farm-sim/source/src/core/settings.js, core/state.js + original day step.
 * Worker has no access to Homestead's coordinator, live farm, or Three.js world.
 */
"use strict";
importScripts("../vendor/farm-core.js");
const FARM_SOURCE=Object.freeze({
 repository:"worldlinemuse-lgtm/farm-sim",
 revision:"d6614d7981535fa2b74be86e0c5356af57b56e3b",
 path:"source/src/core/settings.js and original core daily biology"
});
const FARM_CONTROLS=Object.freeze({
 // These are the actual native settings.js P keys, not rewritten algorithms.
 // Limits are defensive study budgets, not native biological source limits.
 mg_does:Object.freeze({label:"Breeding does",unit:"does",default:6,min:0,max:20}),
 mg_hens:Object.freeze({label:"Laying hens",unit:"hens",default:12,min:0,max:60}),
 mg_roosters:Object.freeze({label:"Roosters",unit:"birds",default:1,min:0,max:10}),
 mg_set:Object.freeze({label:"Incubator eggs per week",unit:"eggs/wk",default:5,min:0,max:25})
});
const integer=(name,x,min,max)=>{
 if(!Number.isSafeInteger(x)||x<min||x>max)
  throw new RangeError(name+" must be an integer in ["+min+", "+max+"]");
 return x;
};
function assertFarmRequest(input){
 if(!input||typeof input!=="object"||Array.isArray(input)||
    Object.keys(input).some(k=>!["schema","seed","days","parameters"].includes(k)))
  throw new TypeError("Invalid independent Farm study request");
 if(input.schema!==1)throw new TypeError("Unsupported Farm study schema");
 integer("Seed",input.seed,0,4294967295);
 if(![7,30,90].includes(input.days))throw new RangeError("Farm horizon must be 7, 30 or 90 days");
 const p=input.parameters;
 if(!p||typeof p!=="object"||Array.isArray(p)||
    Object.keys(p).length!==Object.keys(FARM_CONTROLS).length||
    Object.keys(p).some(k=>!Object.hasOwn(FARM_CONTROLS,k)))
  throw new TypeError("Farm source parameters must match the four native controls");
 for(const [key,{min,max}] of Object.entries(FARM_CONTROLS))integer(key,p[key],min,max);
 return input;
}
function measure(snapshot,{initial=false}={}){
 if(!snapshot||!Number.isSafeInteger(snapshot.day)||
    typeof snapshot.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.date)||
    (!initial&&!snapshot.daily)||!snapshot.counts)
  throw new Error("Original Farm engine returned incomplete daily snapshot");
 const value=(name,x)=>{
  if(typeof x!=="number"||!Number.isFinite(x)||x<0)
   throw new Error("Original Farm model returned invalid "+name);
  return x;
 };
 const base={day:snapshot.day,date:snapshot.date,
  animals:value("animal count",snapshot.counts.n)};
 // Original newState/reset has an EMPTY S.hist, so no day-zero daily record.
 // Do not invent values: source measurements begin at advanceDay().
 if(initial&&!snapshot.daily)
  return Object.freeze({...base,eggs:null,waterGal:null,electricityKWh:null});
 return Object.freeze({...base,
  eggs:value("eggs",snapshot.daily.eggs??0),
  waterGal:value("waterGal",snapshot.daily.waterGal),
  electricityKWh:value("kWh",snapshot.daily.kWh)
 });
}
function executeFarmStudy(input){
 const request=assertFarmRequest(input);
 const original=globalThis.HomesteadFarmCore;
 if(!original||typeof original.reset!=="function"||
    typeof original.setParameter!=="function"||
    typeof original.advanceDay!=="function"||typeof original.snapshot!=="function")
  throw new Error("Original Farm biological engine unavailable");
 // Fresh worker instance per calculation makes P, S, all RNG and visual state
 // private. A failed study is discarded on termination; no partial live writes.
 // Original Farm core requires a real seeded state before setParameter()
 // (setParameter invokes refreshToday against S.today). Initialize, set native
 // P values, then reseed once so startup herd matches the edited settings.
 original.reset(request.seed);
 for(const [key,value] of Object.entries(request.parameters))
  original.setParameter(key,value);
 original.reset(request.seed);
 const initial=measure(original.snapshot(),{initial:true}),series=[];
 let waterGal=0,electricityKWh=0,eggs=0;
 for(let i=0;i<request.days;i++){
  const day=measure(original.advanceDay());
  if(day.day!==initial.day+i+1)
   throw new Error("Original Farm model clock failed consecutive-day audit");
  series.push(day);
  waterGal+=day.waterGal;electricityKWh+=day.electricityKWh;eggs+=day.eggs;
  if(![waterGal,electricityKWh,eggs].every(Number.isFinite))
   throw new Error("Farm cumulative native resource overflow");
 }
 return Object.freeze({
  schema:1,kind:"isolated-native-farm-daily-scenario",
  source:FARM_SOURCE,
  mode:"independent source-engine study; does not change live Homestead",
  seed:request.seed,days:request.days,
  parameters:Object.freeze({...request.parameters}),
  initial,final:series.at(-1),
  totals:Object.freeze({waterGal,electricityKWh,eggs}),
  series:Object.freeze(series),
  limitations:Object.freeze([
   "Original Farm source biological daily model, not the unavailable original annual planner.",
   "Source daily water and energy needs are modeled demands; no connected Solar or Water shortage feedback.",
   "Results are scenario estimates, not production, animal welfare, or financial guarantees."
  ])
 });
}
self.onmessage=event=>{
 try{
  const result=executeFarmStudy(event?.data);
  self.postMessage({ok:true,result});
 }catch(error){
  self.postMessage({ok:false,error:String(error?.message||error)});
 }
};