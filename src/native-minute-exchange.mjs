/** Native minute exchange: callbacks must invoke original engines, never estimated PV. */
const valid=(name,n)=>{if(!Number.isFinite(n)||n<0)throw new RangeError(name+" must be finite and nonnegative");return n};
const clone=x=>structuredClone(x);
export function exchangeNativeHour({clockMinute,loads,solarStep,waterStep,farmStep,state}){
 if(!Number.isSafeInteger(clockMinute)||clockMinute<0||clockMinute%60)throw new RangeError("unaligned clock");
 if(!Array.isArray(loads)||loads.length!==60)throw new RangeError("60 minute demands required");
 for(const fn of [solarStep,waterStep,farmStep])if(typeof fn!=="function")throw new TypeError("native callback required");
 if(!state||typeof state!=="object")throw new TypeError("world state required");
 const next=clone(state),ledger=[];
 if(next.clockMinute!==undefined&&next.clockMinute!==clockMinute)throw new RangeError("world clock discontinuity");
 for(const d of loads){valid("baseWh",d?.baseWh);valid("waterWh",d?.waterWh);valid("farmWh",d?.farmWh);}
 let energyRequestedWh=0,energyDeliveredWh=0,waterProducedL=0,waterConsumedTotalL=0;
 let carriedWaterL=valid("storedWaterL",next.storedWaterL??0);
 const capacityL=valid("waterCapacityL",next.waterCapacityL??Number.MAX_VALUE);
 if(carriedWaterL>capacityL)throw new RangeError("water inventory exceeds capacity");
 let overflowTotalL=0;
 for(let i=0;i<60;i++){
  const minute=clockMinute+i,d=loads[i];
  const baseWh=valid("baseWh",d?.baseWh),waterWh=valid("waterWh",d?.waterWh),farmWh=valid("farmWh",d?.farmWh);
  const requestedWh=valid("requestedWh",baseWh+waterWh+farmWh);
  const solar=solarStep({minute,requestedWh,state:clone(next.solar)});
  const deliveredWh=valid("deliveredWh",solar?.deliveredWh);
  if(deliveredWh>requestedWh+1e-7)throw new RangeError("native Solar over-delivery");
  if(solar.state===undefined)throw new TypeError("Solar state missing");
  next.solar=solar.state;
  const baseServedWh=Math.min(baseWh,deliveredWh);
  const waterServedWh=Math.min(waterWh,deliveredWh-baseServedWh);
  const farmServedWh=Math.min(farmWh,deliveredWh-baseServedWh-waterServedWh);
  const water=waterStep({minute,requestedWh:waterWh,deliveredWh:waterServedWh,state:clone(next.water)});
  const waterDeliveredL=valid("waterDeliveredL",water?.deliveredL);
  const availableWaterL=valid("availableWaterL",carriedWaterL+waterDeliveredL);
  const farm=farmStep({minute,requestedWh:farmWh,deliveredWh:farmServedWh,waterDeliveredL:availableWaterL,state:clone(next.farm)});
  const waterConsumedL=valid("waterConsumedL",farm?.waterConsumedL??0);
  if(waterConsumedL>availableWaterL+1e-7)throw new RangeError("native Farm water over-consumption");
  const remainingL=Math.max(0,availableWaterL-waterConsumedL);
  const overflowL=Math.max(0,remainingL-capacityL);
  carriedWaterL=remainingL-overflowL;
  overflowTotalL+=overflowL;
  energyRequestedWh+=requestedWh;energyDeliveredWh+=deliveredWh;
  waterProducedL+=waterDeliveredL;waterConsumedTotalL+=waterConsumedL;
  if(water?.state===undefined||farm?.state===undefined)throw new TypeError("resource state missing");
  next.water=water.state;next.farm=farm.state;
  if(Math.abs(baseServedWh+waterServedWh+farmServedWh-deliveredWh)>1e-7)throw new Error("energy conservation");
  ledger.push({minute,requestedWh,deliveredWh,baseServedWh,waterServedWh,farmServedWh,waterDeliveredL,waterConsumedL,waterOverflowL:overflowL,waterRemainingL:carriedWaterL,
   native:{solar:solar.native===undefined?null:clone(solar.native),water:water.native===undefined?null:clone(water.native),farm:farm.native===undefined?null:clone(farm.native)}});
 }
 next.storedWaterL=carriedWaterL;
 next.clockMinute=clockMinute+60;
 const initialWaterL=state.storedWaterL??0;
 if(Math.abs(initialWaterL+waterProducedL-waterConsumedTotalL-overflowTotalL-carriedWaterL)>1e-6)throw new Error("water conservation");
 return {state:next,ledger,waterOverflowL:overflowTotalL,totals:{energyRequestedWh,energyDeliveredWh,waterProducedL,waterConsumedL:waterConsumedTotalL,waterStoredL:carriedWaterL}};
}
