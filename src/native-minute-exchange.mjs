/** Native minute exchange: callbacks must invoke original engines, never estimated PV. */
const valid=(name,n)=>{if(!Number.isFinite(n)||n<0)throw new RangeError(name+" must be finite and nonnegative");return n};
const clone=x=>structuredClone(x);
export function exchangeNativeHour({clockMinute,loads,solarStep,waterStep,farmStep,state}){
 if(!Number.isSafeInteger(clockMinute)||clockMinute<0||clockMinute%60)throw new RangeError("unaligned clock");
 if(!Array.isArray(loads)||loads.length!==60)throw new RangeError("60 minute demands required");
 for(const fn of [solarStep,waterStep,farmStep])if(typeof fn!=="function")throw new TypeError("native callback required");
 if(!state||typeof state!=="object")throw new TypeError("world state required");
 const next=clone(state),ledger=[];
 let carriedWaterL=valid("storedWaterL",next.storedWaterL??0);
 const capacityL=valid("waterCapacityL",next.waterCapacityL??Number.MAX_VALUE);
 if(carriedWaterL>capacityL)throw new RangeError("water inventory exceeds capacity");
 let overflowTotalL=0;
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
  const availableWaterL=valid("availableWaterL",carriedWaterL+waterDeliveredL);
  const farm=farmStep({minute,requestedWh:farmWh,deliveredWh:farmServedWh,waterDeliveredL:availableWaterL,state:next.farm});
  const waterConsumedL=valid("waterConsumedL",farm?.waterConsumedL??0);
  if(waterConsumedL>availableWaterL+1e-7)throw new RangeError("native Farm water over-consumption");
  const remainingL=Math.max(0,availableWaterL-waterConsumedL);
  const overflowL=Math.max(0,remainingL-capacityL);
  carriedWaterL=remainingL-overflowL;
  overflowTotalL+=overflowL;
  if(water?.state===undefined||farm?.state===undefined)throw new TypeError("resource state missing");
  next.water=water.state;next.farm=farm.state;
  if(Math.abs(baseServedWh+waterServedWh+farmServedWh-deliveredWh)>1e-7)throw new Error("energy conservation");
  ledger.push({minute,requestedWh,deliveredWh,baseServedWh,waterServedWh,farmServedWh,waterDeliveredL,waterConsumedL,waterOverflowL:overflowL,waterRemainingL:carriedWaterL});
 }
 next.storedWaterL=carriedWaterL;
 return {state:next,ledger,waterOverflowL:overflowTotalL};
}
