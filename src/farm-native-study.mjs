// Versioned bridge to exact original Farm daily biology. NO duplicate biology.
// The worker always owns a new isolated Farm closure; never pass the live engine.
export const FARM_STUDY_SOURCE=Object.freeze({
 repository:"worldlinemuse-lgtm/farm-sim",
 revision:"d6614d7981535fa2b74be86e0c5356af57b56e3b",
 path:"source/src/core/settings.js and original core daily biology"
});
export const FARM_STUDY_FIELDS=Object.freeze([
 Object.freeze({key:"mg_does",title:"Breeding does",unit:"does",default:6,min:0,max:20}),
 Object.freeze({key:"mg_hens",title:"Laying hens",unit:"hens",default:12,min:0,max:60}),
 Object.freeze({key:"mg_roosters",title:"Roosters",unit:"birds",default:1,min:0,max:10}),
 Object.freeze({key:"mg_set",title:"Incubator eggs per week",unit:"eggs/wk",default:5,min:0,max:25})
]);
const must=(ok,message)=>{if(!ok)throw new RangeError(message);};
export function farmStudyRequest({seed=7,days=7,parameters={}}={}){
 must(Number.isSafeInteger(seed)&&seed>=0&&seed<=4294967295,"Farm seed must be an unsigned 32-bit integer");
 must([7,30,90].includes(days),"Farm study duration must be 7, 30 or 90 days");
 must(parameters&&typeof parameters==="object"&&!Array.isArray(parameters),"Farm source controls must be an object");
 const allowed=FARM_STUDY_FIELDS.map(f=>f.key);
 for(const k of Object.keys(parameters))must(allowed.includes(k),"Unsupported original Farm control: "+k);
 const values={};
 for(const field of FARM_STUDY_FIELDS){
  const x=Object.hasOwn(parameters,field.key)?parameters[field.key]:field.default;
  must(Number.isSafeInteger(x)&&x>=field.min&&x<=field.max,
   field.title+" must be an integer in ["+field.min+", "+field.max+"] "+field.unit);
  values[field.key]=x;
 }
 return Object.freeze({schema:1,seed,days,parameters:Object.freeze(values)});
}
const finite=(label,value)=>must(typeof value==="number"&&Number.isFinite(value)&&value>=0,
 "Invalid original Farm "+label);
export function verifyFarmStudyResult(raw,req){
 must(raw&&typeof raw==="object"&&raw.schema===1&&raw.kind==="isolated-native-farm-daily-scenario",
  "Invalid original Farm study response");
 must(raw.source?.revision===FARM_STUDY_SOURCE.revision&&
  raw.source?.path===FARM_STUDY_SOURCE.path,
  "Incorrect original Farm source provenance");
 must(raw.seed===req.seed&&raw.days===req.days&&
  Object.keys(raw.parameters||{}).length===FARM_STUDY_FIELDS.length&&
  FARM_STUDY_FIELDS.every(f=>raw.parameters[f.key]===req.parameters[f.key]),
  "Original Farm response identity mismatch");
 must(Array.isArray(raw.series)&&raw.series.length===req.days,"Original Farm timeline length mismatch");
 const dailyFields=["animals","eggs","waterGal","electricityKWh"];
 const check=(row,day,initial=false)=>{
  must(row&&Number.isSafeInteger(row.day)&&row.day===day&&
    typeof row.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(row.date),
   "Malformed original Farm day/date");
  if(initial){
   // Original Farm reset() exposes day 0 with null daily ledger, not measured zeros.
   finite("animals",row.animals);
   for(const key of ["eggs","waterGal","electricityKWh"])
    must(row[key]===null,"Original Farm day-zero ledger must be null until advanceDay()");
  }else for(const key of dailyFields)finite(key,row[key]);
  const dateMs=Date.parse(row.date+"T00:00:00Z");
  must(Number.isFinite(dateMs)&&new Date(dateMs).toISOString().startsWith(row.date),
   "Invalid original Farm calendar date");
  return dateMs;
 };
 must(raw.initial?.day===0,"Original Farm initial day must be zero");
 const start=check(raw.initial,0,true);
 let sums={waterGal:0,electricityKWh:0,eggs:0};
 for(let i=0;i<req.days;i++){
  const day=raw.series[i];
  const dateMs=check(day,raw.initial.day+i+1);
  must(dateMs-start===(i+1)*86400000,"Original Farm chronology is not consecutive");
  for(const key of Object.keys(sums))sums[key]+=day[key];
 }
 must(raw.final?.day===raw.series.at(-1).day&&
  raw.final?.date===raw.series.at(-1).date&&
  dailyFields.every(k=>raw.final[k]===raw.series.at(-1)[k]),
  "Original Farm final state mismatch");
 for(const [k,total] of Object.entries(sums)){
  finite("total "+k,raw.totals?.[k]);
  must(Math.abs(raw.totals[k]-total)<=1e-8*Math.max(1,total),
   "Original Farm "+k+" conservation mismatch");
 }
 must(Array.isArray(raw.limitations)&&raw.limitations.length>=2&&
   raw.limitations.every(s=>typeof s==="string"&&s.trim()),
  "Missing original Farm scope/limitations");
 return Object.freeze(raw);
}
/** Fresh worker for every run, bounded computation and no network requests. */
export function runNativeFarmDailyStudy(options={},createWorker=()=>new Worker(
 new URL("./farm-study-worker.js",import.meta.url))){
 const request=farmStudyRequest(options);
 return new Promise((resolve,reject)=>{
  let worker,complete=false,timer;
  const finish=(error,value)=>{
   if(complete)return;
   complete=true;clearTimeout(timer);
   try{worker?.terminate();}catch{}
   if(error)reject(error);else resolve(value);
  };
  try{
   worker=createWorker();
   if(!worker||typeof worker.postMessage!=="function"||
      typeof worker.addEventListener!=="function"||typeof worker.terminate!=="function")
    throw new Error("Original Farm study worker could not initialize");
   worker.addEventListener("message",event=>{
    const response=event?.data;
    if(!response||response.ok!==true){
     finish(new Error("Original Farm study failed: "+String(response?.error||"incomplete worker response")));
     return;
    }
    try{finish(null,verifyFarmStudyResult(response.result,request))}
    catch(error){finish(error)}
   });
   worker.addEventListener("error",event=>finish(new Error(
    "Original Farm study worker error: "+String(event?.message||"unknown failure"))));
   timer=setTimeout(()=>finish(new Error("Original Farm study exceeded the 30 s execution budget")),30000);
   worker.postMessage(request);
  }catch(error){finish(error)}
 });
}