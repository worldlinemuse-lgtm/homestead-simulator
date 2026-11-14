// Exact-source Solar battery study adapter. No replacement battery physics.
// Original: solar-sandbox/source/battery.js @ 871dd8c0ef03a05feb339c9761ead900875f16b5
// Blob: d3190721347fc53991a5d1c7b535dd658c46696f
export const SOLAR_BATTERY_SOURCE=Object.freeze({
 repository:"worldlinemuse-lgtm/solar-sandbox",
 revision:"871dd8c0ef03a05feb339c9761ead900875f16b5",
 path:"source/battery.js",
 blob:"d3190721347fc53991a5d1c7b535dd658c46696f"
});
const finite=(name,value,min,max)=>{
 if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)
  throw new RangeError(name+" must be a finite number in ["+min+", "+max+"]");
 return value;
};
const sourceNumber=(name,value,{zero=false,max=Infinity}={})=>{
 if(typeof value!=="number"||!Number.isFinite(value)||
   (zero?value<0:value<=0)||value>max)
  throw new RangeError("Original Solar model returned invalid "+name);
 return value;
};
const sourceRecord=(name,record)=>{
 if(!record||typeof record!=="object"||Array.isArray(record))
  throw new TypeError("Original Solar model returned invalid "+name);
 return record;
};
const sourceFlag=(name,value)=>{
 if(typeof value!=="boolean")
  throw new TypeError("Original Solar model returned invalid "+name);
 return value;
};
export function evaluateNativeSolarBattery(model,options={}){
 if(!model||typeof model!=="object"||
  !["drainMult","agmCapAt","agmTempFactor","absorption","agmPeukert","heatMinutes"]
    .every(k=>typeof model[k]==="function")||
  !model.HEAT||!model.SRC)
  throw new TypeError("The original Solar battery model is required");
 if(!options||typeof options!=="object"||Array.isArray(options))
  throw new TypeError("Battery study options must be an object");
 const allowed=["chem","currentA","tempC","socPercent","absorptionMinutes","bankAh","heatMode"];
 for(const key of Object.keys(options))
  if(!allowed.includes(key))throw new TypeError("Unsupported battery study parameter: "+key);
 const {
  chem="agm",currentA=10,tempC=20,socPercent=50,
  absorptionMinutes=0,bankAh=100,heatMode="off"
 }=options;
 if(!["agm","lfp"].includes(chem))throw new RangeError("Unsupported battery chemistry");
 if(!["off","fast","mid","slow"].includes(heatMode))throw new RangeError("Unsupported original heating rate");
 finite("currentA",currentA,0,300);
 finite("tempC",tempC,-30,60);
 finite("socPercent",socPercent,0,100);
 finite("absorptionMinutes",absorptionMinutes,0,1440);
 finite("bankAh",bankAh,1,10000);
 if(heatMode!=="off"&&(chem!=="lfp"||tempC>=5||tempC< -20))
  throw new RangeError("Original self-heating estimate requires an LFP self-heating design between -20 °C and 5 °C");
 const discharge=model.drainMult(chem,currentA,tempC);
 const charge=model.absorption(chem,socPercent/100,absorptionMinutes,bankAh);
 const agm=chem==="agm"?model.agmCapAt(currentA):null;
 const heat=heatMode==="off"?null:model.HEAT[heatMode];
 // Validate EVERY exposed native output, not merely the headline capacity.
 // Original battery physics remains entirely inside the pinned source.
 sourceRecord("discharge",discharge);
 sourceNumber("discharge multiplier",discharge.m);
 sourceNumber("discharge rate factor",discharge.rate);
 sourceNumber("discharge temperature factor",discharge.temp);
 if(chem==="agm"){
  sourceFlag("discharge beyond flag",discharge.beyond);
  sourceFlag("discharge cold flag",discharge.cold);
 }else if(discharge.note!==undefined&&
   (typeof discharge.note!=="string"||!discharge.note.trim()))
  throw new TypeError("Original Solar model returned invalid discharge note");
 sourceRecord("charging",charge);
 sourceNumber("charging multiplier",charge.mult,{zero:true,max:1});
 if(!["bulk","absorption","float"].includes(charge.phase))
  throw new RangeError("Original Solar model returned invalid charging phase");
 if(charge.limit!=null)
  sourceNumber("charging time limit",charge.limit,{zero:true});
 if(agm){
  sourceRecord("AGM capacity",agm);
  sourceNumber("AGM available Ah",agm.ah);
  sourceFlag("AGM beyond flag",agm.beyond);
  sourceFlag("AGM below flag",agm.below);
 }
 const agmTemperatureFactor=agm?sourceNumber("AGM temperature factor",model.agmTempFactor(tempC)):null;
 const peukertDisplayExponent=agm?sourceNumber("AGM Peukert exponent",model.agmPeukert()):null;
 const heating=heat?(()=>{
  sourceRecord("heating specification",heat);
  const rate=sourceNumber("heating rate",heat.rate);
  if(typeof heat.label!=="string"||!heat.label.trim())
   throw new TypeError("Original Solar model returned invalid heating label");
  const minutes=sourceNumber("heating minutes",model.heatMinutes(rate,tempC,5),{zero:true});
  return Object.freeze({mode:heatMode,rateCPerMinute:rate,
   minutesTo5C:minutes,assumption:heat.label});
 })():null;
 const warnings=[];
 if(chem==="agm"){
  if(agm.beyond)warnings.push("Current exceeds the original Renogy AGM table; capacity estimate is clamped at its high-current endpoint.");
  if(tempC< -15||tempC>40)warnings.push("Temperature lies outside the source AGM capacity table; endpoint behavior is assumed.");
  warnings.push("Rate and temperature multipliers are combined by the source model as an explicit assumption.");
 }else{
  warnings.push("Original Solar LFP model does not adjust capacity for discharge rate or temperature.");
 }
 if(heatMode!=="off")warnings.push("Heating timing is a model estimate from the LiTime manual, not a guaranteed battery warm-up or charging-safety certification.");
 const report={
  schema:1,kind:"isolated-solar-native-battery-study",source:SOLAR_BATTERY_SOURCE,
  mode:"independent engineering study; live Homestead battery state unchanged",
  inputs:Object.freeze({chem,currentA,tempC,socPercent,absorptionMinutes,bankAh,heatMode}),
  discharge:Object.freeze({...discharge}),
  agmAtCurrent:agm?Object.freeze({...agm}):null,
  agmTemperatureFactor,peukertDisplayExponent,
  charging:Object.freeze({...charge}),
  heating,
  warnings:Object.freeze(warnings)
 };
 for(const [name,value] of Object.entries({
  multiplier:discharge.m,chargeMultiplier:charge.mult,
  capacity:agm?.ah??1,heatingMinutes:heating?.minutesTo5C??0
 }))
  if(typeof value!=="number"||!Number.isFinite(value)||value<0)
   throw new RangeError("Original Solar model returned invalid "+name);
 return Object.freeze(report);
}

// A source-anchor sweep, NOT a fitted replacement or a new battery equation.
// Each point calls the original engine at an actual Renogy 25 °C table current.
export function evaluateNativeSolarAgmSweep(model,{tempC=20}={}){
 if(!model||typeof model.drainMult!=="function"||
    !Array.isArray(model.AGM_RATE)||typeof model.agmCapAt!=="function")
  throw new TypeError("Original AGM source capacity table is required");
 finite("tempC",tempC,-15,40);
 if(model.AGM_RATE.length<4||model.AGM_RATE.length>64)
  throw new TypeError("Original AGM source table length is invalid");
 const points=model.AGM_RATE.map(row=>{
  if(!Array.isArray(row)||row.length!==2)
   throw new TypeError("Original AGM source table row is invalid");
  const [hours,amps]=row;
  finite("source rate hours",hours,0.01,1000);
  finite("source rate current",amps,0.01,1000);
  const direct=sourceRecord("AGM sweep discharge",model.drainMult("agm",amps,tempC));
  const capacity=sourceRecord("AGM sweep capacity",model.agmCapAt(amps));
  const availableAh=sourceNumber("AGM sweep available Ah",capacity.ah);
  const multiplier=sourceNumber("AGM sweep multiplier",direct.m);
  const rate=sourceNumber("AGM sweep rate factor",direct.rate);
  const temperatureFactor=sourceNumber("AGM sweep temperature factor",direct.temp);
  sourceFlag("AGM sweep beyond flag",capacity.beyond);
  sourceFlag("AGM sweep below flag",capacity.below);
  return Object.freeze({
   currentA:amps,sourceRatedHours:hours,
   availableAh,drainMultiplier:multiplier,
   sourceRateFactor:rate,sourceTemperatureFactor:temperatureFactor
  });
 }).sort((a,b)=>a.currentA-b.currentA);
 if(points.some((p,i)=>i>0&&p.currentA===points[i-1].currentA))
  throw new TypeError("Duplicate source AGM discharge current");
 return Object.freeze({
  schema:1,kind:"isolated-solar-native-agm-table-sweep",
  source:SOLAR_BATTERY_SOURCE,tempC,
  mode:"independent source table comparison; no live state mutation",
  points:Object.freeze(points),
  limitations:Object.freeze([
   "Only the original Renogy AGM table currents are sampled; no alternate battery chemistry is claimed.",
   "Source rate and temperature corrections are combined using its explicit assumption; discharge forecasts are not certified."
  ])
 });
}
