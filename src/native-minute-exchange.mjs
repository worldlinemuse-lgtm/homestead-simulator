/** Native minute exchange: callbacks must invoke original engines, never estimated PV. */
const valid=(name,n)=>{if(!Number.isFinite(n)||n<0)throw new RangeError(name+" must be finite and nonnegative");return n};
const clone=x=>structuredClone(x);
export function exchangeNativeHour({clockMinute,loads,solarStep,waterStep,farmStep,state}){
 if(!Number.isSafeInteger(clockMinute)||clockMinute<0||clockMinute%60)throw new RangeError("unaligned clock");
 if(!Array.isArray(loads)||loads.length!==60)throw new RangeError("60 minute demands required");
 for(const fn of [solarStep,waterStep,farmStep])if(typeof fn!=="function")throw new TypeError("native callback required");
 const next=clone(state),ledger=[];
 for(let i=0;i<60;i++){
  const minute=clockMinute+i,d=loads[i];
  const baseWh=valid("baseWh",d?.baseWh),waterWh=valid("waterWh",d?.waterWh),farmWh=valid("farmWh",d?.farmWh);
  const requestedWh=valid("requestedWh",baseWh+waterWh+farmWh);
  const solar=solarStep({minute,requestedWh,state:next.solar});
  const deliveredWh=valid("deliveredWh",solar?.deliveredWh);
  if(deliveredWh>requestedWh+1e-7)throw new RangeError("native Solar over-delivery");
  if(solar.state===undefined)throw new TypeError("Solar state missing");
  next.solar=solar.state;
  const baseServedWh=Math.min(baseWh,deliveredWh);
  const waterServedWh=Math.min(waterWh,deliveredWh-baseServedWh);
  const farmServedWh=Math.min(farmWh,deliveredWh-baseServedWh-waterServedWh);
  const water=waterStep({minute,requestedWh:waterWh,deliveredWh:waterServedWh,state:next.water});
  const waterDeliveredL=valid("waterDeliveredL",water?.deliveredL);
  const farm=farmStep({minute,requestedWh:farmWh,deliveredWh:farmServedWh,waterDeliveredL,state:next.farm});
  if(water?.state===undefined||farm?.state===undefined)throw new TypeError("resource state missing");
  next.water=water.state;next.farm=farm.state;
  if(Math.abs(baseServedWh+waterServedWh+farmServedWh-deliveredWh)>1e-7)throw new Error("energy conservation");
  ledger.push({minute,requestedWh,deliveredWh,baseServedWh,waterServedWh,farmServedWh,waterDeliveredL});
 }
 return {state:next,ledger};
}
