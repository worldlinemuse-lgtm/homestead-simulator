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
 const heating=heat?Object.freeze({
  mode:heatMode,rateCPerMinute:heat.rate,
  minutesTo5C:model.heatMinutes(heat.rate,tempC,5),
  assumption:heat.label
 }):null;
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
  agmTemperatureFactor:agm?model.agmTempFactor(tempC):null,
  peukertDisplayExponent:agm?model.agmPeukert():null,
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
