// Native cross-engine resource-ledger inspection utility.
// Reads authoritative coordinator snapshots without advancing or mutating models.
export const LEDGER_COLUMNS=Object.freeze([
  "model","schema","date","elapsed_hours","pv_generated_Wh","base_served_Wh",
  "pump_served_Wh","battery_stored_Wh","energy_unserved_Wh",
  "water_treated_L","water_consumed_L","water_overflow_L",
  "water_stored_L","water_shortfall_L","farm_animals"
]);
const finite=(name,value)=>{if(typeof value!=="number"||!Number.isFinite(value)||value<0)
  throw new TypeError(name+" must be a nonnegative finite number");return value};
const csvCell=value=>'"'+String(value).replace(/"/g,'""')+'"';
export function nativeLedgerRow(snapshot){
  if(!snapshot||snapshot.schema!==1||snapshot.model!=="experimental-coupled-scenario")
    throw new TypeError("Unsupported scenario snapshot");
  const c=snapshot.cumulative||{},clock=snapshot.clock||{},farm=snapshot.farm||{};
  if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(clock.date))
    throw new TypeError("Invalid scenario date");
  return [
    snapshot.model,snapshot.schema,clock.date,finite("elapsed_hours",clock.hours),
    finite("pvWh",c.pvWh),finite("baseWh",c.baseWh),
    finite("pumpWh",c.pumpWh),finite("batteryWh",snapshot.batteryWh),
    finite("energyDeficitWh",c.energyDeficitWh),
    finite("treatedL",c.treatedL),finite("waterConsumedL",c.waterConsumedL),
    finite("overflowL",c.overflowL),finite("waterStoredL",snapshot.waterStoredL),
    finite("waterDeficitL",c.waterDeficitL),finite("farm counts",farm.counts?.n)
  ];
}
export function nativeLedgerCsv(snapshot){
  const values=nativeLedgerRow(snapshot);
  return LEDGER_COLUMNS.map(csvCell).join(",")+"\\r\\n"+values.map(csvCell).join(",")+"\\r\\n";
}
