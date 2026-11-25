/**
 * Native Farm biological advancement from metered minute-by-minute deliveries.
 *
 * This calls the ORIGINAL vendored Farm snapshot, equipmentSnapshot,
 * checkpoint, restoreCheckpoint and advanceDay functions. Biological behavior
 * is never approximated here. The original daily-demand contract is uniformly
 * allocated over 1,440 minutes, matching the existing Homestead coordinator's
 * explicitly uniform daily resource allocation assumption.
 *
 * Farm is a singleton, so each callback restores its caller's state in finally.
 * A biological day is advanced only after the last native minute of that day.
 */
const GAL_TO_L = 3.78541, MINUTES_PER_DAY = 1440, EPS = 1e-6;
const clone = x => structuredClone(x);
const valid = (name,x) => {
  if (!Number.isFinite(x) || x < 0) throw new RangeError(name+" must be finite and nonnegative");
  return x;
};
const emptyTotals = () => ({
  waterRequestedL:0, waterDeliveredL:0,
  electricityRequestedWh:0, electricityDeliveredWh:0,
  equipment:{}
});
const coverage = (served,wanted) => wanted === 0 ? 1 : Math.min(1,served/wanted);

export function initialOriginalFarmMinuteState(farm) {
  if (!farm || typeof farm.checkpoint !== "function" || typeof farm.snapshot !== "function")
    throw new TypeError("Original Farm checkpoint and snapshot required");
  const snapshot = farm.snapshot();
  if (!snapshot?.daily || !Number.isSafeInteger(snapshot.day))
    throw new TypeError("Native Farm requires an initialized biological demand day");
  return {checkpoint:clone(farm.checkpoint()),dayTotals:emptyTotals()};
}

/** Read the demand from the original Farm model, without changing its singleton. */
export function originalFarmDemandPerMinute(farm, checkpoint) {
  if (!farm || typeof farm.snapshot !== "function" ||
      typeof farm.equipmentSnapshot !== "function" ||
      typeof farm.checkpoint !== "function" ||
      typeof farm.restoreCheckpoint !== "function")
    throw new TypeError("Original Farm metering/checkpoint methods required");
  const was = clone(farm.checkpoint());
  try {
    if (checkpoint) farm.restoreCheckpoint(clone(checkpoint));
    const daily = farm.snapshot().daily;
    if (!daily) throw new TypeError("Original Farm daily resource demand unavailable");
    const waterWh = valid("Farm water gallons per day",daily.waterGal) * GAL_TO_L / MINUTES_PER_DAY;
    const equipment = farm.equipmentSnapshot();
    if (!Array.isArray(equipment)) throw new TypeError("Native Farm equipment list unavailable");
    const equipmentDemand = equipment.map(item => ({
      id:String(item.id),type:item.type,
      requestedWh:valid("Farm equipment native daily Wh",item.nativeDailyDemandWh) / MINUTES_PER_DAY
    }));
    const electricityWh = equipmentDemand.reduce((s,item) => s + item.requestedWh,0);
    valid("Farm equipment electricity Wh",electricityWh);
    return {waterRequiredL:waterWh,electricityRequestedWh:electricityWh,equipment:equipmentDemand};
  } finally {farm.restoreCheckpoint(was);}
}

export function createOriginalFarmMinuteStep(farm) {
  if (!farm || typeof farm.advanceDay !== "function" ||
      typeof farm.checkpoint !== "function" ||
      typeof farm.restoreCheckpoint !== "function" ||
      typeof farm.snapshot !== "function" ||
      typeof farm.equipmentSnapshot !== "function")
    throw new TypeError("Original Farm biological and metering engine required");

  return function farmStep({minute,requestedWh,deliveredWh,waterDeliveredL,state}) {
    if (!Number.isSafeInteger(minute) || minute < 0) throw new RangeError("Invalid Farm minute");
    valid("Farm requestedWh",requestedWh);valid("Farm deliveredWh",deliveredWh);
    valid("Farm available water L",waterDeliveredL);
    if (deliveredWh > requestedWh + EPS) throw new RangeError("Native Farm electrical over-delivery");
    if (!state || !state.checkpoint || !state.dayTotals)
      throw new TypeError("Native Farm checkpoint and day ledger required");
    const original = clone(farm.checkpoint());
    try {
      farm.restoreCheckpoint(clone(state.checkpoint));
      const beforeDay = farm.snapshot().day;
      const demand = originalFarmDemandPerMinute(farm);
      if (Math.abs(requestedWh - demand.electricityRequestedWh) > EPS)
        throw new RangeError("Farm electricity request differs from native equipment demand");
      const waterConsumedL = Math.min(waterDeliveredL,demand.waterRequiredL);
      const totals = clone(state.dayTotals);
      for(const [name,value] of Object.entries({
        waterRequestedL:totals.waterRequestedL,waterDeliveredL:totals.waterDeliveredL,
        electricityRequestedWh:totals.electricityRequestedWh,
        electricityDeliveredWh:totals.electricityDeliveredWh
      })) valid("Farm daily "+name,value);
      totals.waterRequestedL += demand.waterRequiredL;
      totals.waterDeliveredL += waterConsumedL;
      totals.electricityRequestedWh += requestedWh;
      totals.electricityDeliveredWh += deliveredWh;
      const equipmentMinute=[];
      let remainingWh = deliveredWh;
      for (const e of demand.equipment) {
        const served = Math.min(e.requestedWh,remainingWh);
        remainingWh -= served;
        equipmentMinute.push({id:e.id,type:e.type,requestedWh:e.requestedWh,servedWh:served});
        const total = totals.equipment[e.id] || {requestedWh:0,servedWh:0};
        total.requestedWh += e.requestedWh;
        total.servedWh += served;
        totals.equipment[e.id] = total;
      }
      if (Math.abs(remainingWh) > EPS) throw new Error("Farm native equipment allocation did not reconcile");
      let advancedDay = false, completedDay = null, nextTotals = totals;
      if (minute % MINUTES_PER_DAY === MINUTES_PER_DAY - 1) {
        const byId = Object.fromEntries(Object.entries(totals.equipment)
          .map(([id,entry])=>[id,coverage(entry.servedWh,entry.requestedWh)]));
        const supply = {
          waterCoverage:coverage(totals.waterDeliveredL,totals.waterRequestedL),
          electricityCoverage:coverage(totals.electricityDeliveredWh,totals.electricityRequestedWh),
          equipmentCoverageById:byId
        };
        farm.advanceDay(supply);
        if (farm.snapshot().day !== beforeDay + 1)
          throw new Error("Original Farm failed to advance exactly one biological day");
        completedDay = {supply,totals};
        nextTotals = emptyTotals();
        advancedDay = true;
      }
      return {
        waterConsumedL,
        state:{checkpoint:clone(farm.checkpoint()),dayTotals:nextTotals},
        native:{source:"farm-sim/source/src/",advancedDay,completedDay,
          biologicalDay:farm.snapshot().day,waterRequiredL:demand.waterRequiredL,equipment:equipmentMinute}
      };
    } finally {
      farm.restoreCheckpoint(original);
    }
  };
}
