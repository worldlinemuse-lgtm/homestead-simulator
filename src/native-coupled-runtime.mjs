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
  const farmStep=createOriginalFarmMinuteStep(farmCore);
  return function advanceNativeHour({clockMinute,state}) {
    if (!state || !state.farm || !state.water) throw new TypeError("Native Farm/Water world state required");
    // Source Water component pressure is authoritative. A 3D pump edit changes
    // this native part, not a separate illustrative PSI number.
    const nativePump=state.water.parts?.find(p=>pumpId?p.id===pumpId:p.type==="pump_sky");
    const livePsi=nativePump?.params?.psi ?? pumpPressurePsi;
    validate("Native Water pump pressure PSI",livePsi);
    const waterStep=createOriginalWaterMinuteStep(waterCore,{pumpPressurePsi:livePsi,pumpId});
    const settings=state.operatingSettings ?? {};
    const baseLoad=validate("Background equipment W",settings.backgroundLoadW ?? backgroundLoadW);
    const pumpLoad=validate("Water pump nameplate W",settings.pumpLoadW ?? pumpLoadW);
    // The original source's equipment identity, watts and duty calculations
    // determine Farm demand. No second set of Farm watts is maintained here.
    const farm=originalFarmDemandPerMinute(farmCore,state.farm.checkpoint);
    const baseWh=validate("baseWh",baseLoad/60);
    const waterWh=validate("waterWh",livePsi > 0 ? pumpLoad/60 : 0);
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
    const sums={energyRequestedWh:0,energyDeliveredWh:0,waterProducedL:0,waterConsumedL:0,waterOverflowL:0};
    for(const entry of result.ledger){
      for(const [total,field] of [["energyRequestedWh","requestedWh"],["energyDeliveredWh","deliveredWh"],["waterProducedL","waterDeliveredL"],["waterConsumedL","waterConsumedL"],["waterOverflowL","waterOverflowL"]]){
        if(!Number.isFinite(entry[field])||entry[field]<0)throw new RangeError("Invalid minute resource: "+field);
        sums[total]+=entry[field];
      }
      if(entry.deliveredWh>entry.requestedWh+1e-7)throw new Error("Native minute energy over-delivery");
      const allocations=["baseServedWh","waterServedWh","farmServedWh"];
      if(allocations.some(key=>!Number.isFinite(entry[key])||entry[key]<0)||
         Math.abs(allocations.reduce((sum,key)=>sum+entry[key],0)-entry.deliveredWh)>1e-6)
        throw new Error("Native minute energy allocation mismatch");
    }
    for(const key of ["energyRequestedWh","energyDeliveredWh","waterProducedL","waterConsumedL"]){
      if(Math.abs(sums[key]-result.totals[key])>1e-6)throw new Error("Native hour ledger mismatch: "+key);
    }
    if(Math.abs(sums.waterOverflowL-result.waterOverflowL)>1e-6)throw new Error("Native overflow ledger mismatch");
    if(!Number.isFinite(next.storedWaterL)||!Number.isFinite(result.state.storedWaterL)||
       Math.abs(next.storedWaterL+sums.waterProducedL-sums.waterConsumedL-sums.waterOverflowL-result.state.storedWaterL)>1e-6)
      throw new Error("Native hour water inventory mismatch");
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

/**
 * Mutable control boundary for the scene and Utilities panel. Both must use
 * the same instance: edits are committed only after a successful native batch.
 * No engine is approximated or reimplemented here.
 */
export function createOriginalNativeController({initialState,advanceHour,onSubscriberError=()=>{}}) {
  if (!initialState || typeof initialState !== "object")
    throw new TypeError("Native controller initial state required");
  if (typeof advanceHour !== "function")
    throw new TypeError("Native controller hour callback required");
  if(typeof onSubscriberError!=="function") throw new TypeError("Subscriber error handler must be callable");
  let current=structuredClone(initialState);
  let revision=0;
  // Most recent committed batch is a read-only observation for both 3D and
  // Utilities. It is not a second model or independent conservation ledger.
  let lastBatch=null;
  // Reject nested mutations from a solver callback or subscriber. Otherwise a
  // subscriber could advance the clock while an outer batch is committing,
  // producing out-of-order revisions and diverging scene/Utilities snapshots.
  let mutating=false;
  const listeners=new Set();
  const transaction=fn=>{
    if(mutating)throw new Error("Native controller mutation already in progress");
    mutating=true;
    try{return fn();}finally{mutating=false;}
  };
  const snapshot=()=>structuredClone(current);
  // Each subscriber receives its own copy. Scene rendering must not be able to
  // contaminate Utilities observations or another subscriber's authoritative view.
  const notify=()=>{
    // A failed view must not turn an already committed native hour into an
    // apparent solver failure or prevent the other view from refreshing.
    for(const fn of [...listeners]){
      try{fn(snapshot(),revision);}
      catch(error){
        try{onSubscriberError(error,revision);}
        catch(reportError){console.error("Native subscriber error reporter failed",reportError);}
      }
    }
  };
  return Object.freeze({
    snapshot,
    get revision(){return revision;},
    lastBatch:()=>lastBatch===null?null:structuredClone(lastBatch),
    subscribe(fn){
      if(typeof fn!=="function")throw new TypeError("Native subscriber must be a function");
      listeners.add(fn);
      return ()=>listeners.delete(fn);
    },
    advance(hours=1,{includeLedger=false}={}){
      return transaction(()=>{
        const result=advanceOriginalNativeHours({
          advanceHour,state:current,hours,includeLedger
        });
        current=structuredClone(result.state);
        lastBatch={clockMinute:current.clockMinute,
          totals:structuredClone(result.totals),
          ledger:includeLedger?structuredClone(result.ledger):null};
        revision++;
        notify();
        return {...result,state:snapshot()};
      });
    },
    /**
     * Advance to an absolute hour-aligned model minute. The scene timeline
     * and Utilities use the same authoritative clock, never separate counters.
     * Reject backwards jumps rather than silently replaying or resetting
     * battery, water and biological inventories.
     */
    advanceToMinute(targetMinute,{includeLedger=false}={}){
      if(!Number.isSafeInteger(targetMinute) || targetMinute<0 || targetMinute%60)
        throw new RangeError("Target native minute must be a nonnegative aligned hour");
      const delta=targetMinute-current.clockMinute;
      if(delta<=0 || delta%60)
        throw new RangeError("Native clock target must be later than the current hour");
      return this.advance(delta/60,{includeLedger});
    },
    /**
     * Atomic state edit for a selected 3D object or Utilities control.
     * The caller owns mapping scene IDs to native engine IDs. Refuse changes
     * to the clock; only the native execution path may advance time.
     */
    edit(mutator){
      return transaction(()=>{
      if(typeof mutator!=="function")throw new TypeError("Native edit callback required");
      const draft=snapshot(),clock=draft.clockMinute;
      const replacement=mutator(draft);
      const next=replacement===undefined?draft:replacement;
      if(!next || typeof next!=="object" ||
         next.clockMinute!==clock || !Number.isSafeInteger(clock))
        throw new RangeError("Native edit must preserve the world clock");
      if(!Number.isFinite(next.storedWaterL)||next.storedWaterL<0||
         !Number.isFinite(next.waterCapacityL)||next.waterCapacityL<0||
         next.storedWaterL>next.waterCapacityL)
        throw new RangeError("Native edit violates treated-water capacity");
      current=structuredClone(next);
      lastBatch=null; // a native equipment edit invalidates the preceding meter display
      revision++;
      notify();
      return snapshot();
      });
    }
  });
}
