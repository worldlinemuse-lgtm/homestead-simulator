/**
 * Connected original-engine minute execution. No illustrative PV envelope.
 *
 * Each 60-minute hour:
 *  - Original Solar Sandbox SIM.step owns generation, inverter and battery state.
 *  - Original Water engine.step owns all hydraulic flows and treated liters.
 *  - Original Farm equipmentSnapshot owns electrical demand; original Farm
 *    advanceDay owns biology at midnight, after metered resource coverage.
 *
 * This is the opt-in native execution path. The current 3D coordinator is NOT
 * switched until the original Solar browser runtime can be loaded locally,
 * pinned and checked in the Homestead page.
 */
import {exchangeNativeHour} from "./native-minute-exchange.mjs";
import {createOriginalSolarMinuteStep} from "./native-solar-minute.mjs";
import {createOriginalWaterMinuteStep} from "./native-water-minute.mjs";
import {createOriginalFarmMinuteStep,initialOriginalFarmMinuteState,
  originalFarmDemandPerMinute} from "./native-farm-minute.mjs";

const validate = (name,value) => {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(name + " must be finite and nonnegative");
  return value;
};

export function createOriginalNativeWorld({
  solarSim,waterCore,farmCore,waterWorld,
  clockMinute=0,storedWaterL=0,waterCapacityL=250
}) {
  if (!Number.isSafeInteger(clockMinute) || clockMinute < 0 || clockMinute % 60)
    throw new RangeError("Initial native world clock must be an aligned hour");
  validate("storedWaterL",storedWaterL);
  validate("waterCapacityL",waterCapacityL);
  if (storedWaterL > waterCapacityL) throw new RangeError("Initial treated-water inventory exceeds capacity");
  if (!solarSim || typeof solarSim.grabState !== "function")
    throw new TypeError("Original Solar state unavailable");
  if (!waterCore || typeof waterCore.cloneWorld !== "function")
    throw new TypeError("Original Water world unavailable");
  return {
    clockMinute,solar:structuredClone(solarSim.grabState()),
    water:waterCore.cloneWorld(waterWorld),
    farm:initialOriginalFarmMinuteState(farmCore),
    storedWaterL,waterCapacityL
  };
}

export function createOriginalCoupledHour({
  solarSim,waterCore,farmCore,
  solarOriginMinute=0,backgroundLoadW=85,pumpLoadW=120,pumpPressurePsi=50,
  pumpId
}) {
  validate("backgroundLoadW",backgroundLoadW);
  validate("pumpLoadW",pumpLoadW);
  const solarStep=createOriginalSolarMinuteStep(solarSim,{originMinute:solarOriginMinute});
  const waterStep=createOriginalWaterMinuteStep(waterCore,{pumpPressurePsi,pumpId});
  const farmStep=createOriginalFarmMinuteStep(farmCore);
  return function advanceNativeHour({clockMinute,state}) {
    if (!state || !state.farm) throw new TypeError("Native Farm world state required");
    // The original source's equipment identity, watts and duty calculations
    // determine Farm demand. No second set of Farm watts is maintained here.
    const farm=originalFarmDemandPerMinute(farmCore,state.farm.checkpoint);
    const baseWh=validate("baseWh",backgroundLoadW/60);
    const waterWh=validate("waterWh",pumpPressurePsi > 0 ? pumpLoadW/60 : 0);
    const farmWh=validate("farmWh",farm.electricityRequestedWh);
    const loads=Array.from({length:60},()=>({baseWh,waterWh,farmWh}));
    const result=exchangeNativeHour({
      clockMinute,loads,solarStep,waterStep,farmStep,state
    });
    return {
      ...result,
      demandSource:{
        farm:"original_farm_equipment_snapshot",
        background:"scenario_background_load",
        waterPump:"scenario_pump_nameplate_power",
        farmEquipment:farm.equipment.map(x=>({...x}))
      }
    };
  };
}


/**
 * Advance a shared native world by complete hours without changing the caller's
 * state. The existing native Solar/Water/Farm adapters own all physics.
 * A failed hour rejects the entire batch: no partially advanced world escapes.
 * This is suitable for the 3D clock's fixed-hour catch-up and deterministic
 * replay; it deliberately does not interpolate scientific engine state.
 */
export function advanceOriginalNativeHours({advanceHour,state,hours=1,includeLedger=false}) {
  if (typeof advanceHour !== "function") throw new TypeError("Native hour callback required");
  if (!state || typeof state !== "object") throw new TypeError("Native world state required");
  if (!Number.isSafeInteger(state.clockMinute) || state.clockMinute < 0 ||
      state.clockMinute % 60) throw new RangeError("Native world clock must be hour aligned");
  if (!Number.isSafeInteger(hours) || hours < 1 || hours > 8760)
    throw new RangeError("Native batch must contain 1 to 8760 complete hours");
  let next=structuredClone(state);
  const totals={
    energyRequestedWh:0,energyDeliveredWh:0,
    waterProducedL:0,waterConsumedL:0,waterOverflowL:0
  };
  const ledger=includeLedger?[]:undefined;
  for(let i=0;i<hours;i++){
    const minute=next.clockMinute;
    const result=advanceHour({clockMinute:minute,state:next});
    if(!result?.state || result.state.clockMinute!==minute+60)
      throw new Error("Native hour did not advance exactly 60 minutes");
    if(!Array.isArray(result.ledger) || result.ledger.length!==60 ||
       result.ledger.some((entry,j)=>entry.minute!==minute+j))
      throw new Error("Native hour ledger has missing or unordered minutes");
    for(const key of ["energyRequestedWh","energyDeliveredWh","waterProducedL","waterConsumedL"]){
      const value=result.totals?.[key];
      if(!Number.isFinite(value) || value<0)
        throw new RangeError("Invalid native hourly total: "+key);
      totals[key]+=value;
    }
    const overflow=result.waterOverflowL;
    if(!Number.isFinite(overflow) || overflow<0)
      throw new RangeError("Invalid native water overflow");
    totals.waterOverflowL+=overflow;
    if(includeLedger) ledger.push(...result.ledger);
    next=structuredClone(result.state);
  }
  totals.waterStoredL=next.storedWaterL;
  return {state:next,totals,...(includeLedger?{ledger}:{})};
}
