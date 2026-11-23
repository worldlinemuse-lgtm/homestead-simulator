/**
 * Read-only bridge from the ORIGINAL three-engine world to the already shipped
 * 3D scene snapshot schema. Never performs physical calculations or advances
 * the original engines. The only derived quantities here are sums, ratios and
 * presentation-scale values for previously metered native quantities.
 *
 * Original Farm state is temporarily restored from its actual checkpoint,
 * queried using the source snapshot/equipmentSnapshot, then restored exactly.
 */
const clone=value=>structuredClone(value);
const requireNonnegative=(label,n)=>{
  if(!Number.isFinite(n)||n<0)throw new RangeError("Invalid native presentation quantity: "+label);
  return n;
};
const sum=(entries,key)=>entries.reduce((total,entry)=>
  total+requireNonnegative(key,entry[key]),0);
const close=(a,b)=>Math.abs(a-b)<=1e-6;

export function projectNativeSceneSnapshot({world,legacy,farmCore,lastBatch=null,startHour=9}){
  if(!world || !legacy?.config || !legacy.clock || !farmCore ||
     typeof farmCore.checkpoint!=="function" ||
     typeof farmCore.restoreCheckpoint!=="function" ||
     typeof farmCore.snapshot!=="function" ||
     typeof farmCore.equipmentSnapshot!=="function")
    throw new TypeError("Original Farm and legacy 3D presentation schema are required");
  if(!Number.isSafeInteger(startHour)||startHour<0||startHour>=24 ||
     !Number.isSafeInteger(world.clockMinute)||
     world.clockMinute<startHour*60||world.clockMinute%60)
    throw new RangeError("Native world clock cannot be projected into the 3D timeline");
  requireNonnegative("waterStoredL",world.storedWaterL);
  requireNonnegative("waterCapacityL",world.waterCapacityL);
  if(world.storedWaterL>world.waterCapacityL+1e-7)
    throw new RangeError("Native Water storage exceeds capacity");
  const soc=world.solar?.soc;
  if(!Number.isFinite(soc)||soc<0||soc>1)
    throw new RangeError("Original Solar state of charge must be a fraction in [0,1]");

  const previous=clone(farmCore.checkpoint());
  let farm,equipment;
  try{
    farmCore.restoreCheckpoint(clone(world.farm?.checkpoint));
    farm=clone(farmCore.snapshot());
    equipment=clone(farmCore.equipmentSnapshot());
  }finally{farmCore.restoreCheckpoint(previous);}
  if(!farm||typeof farm.date!=="string"||!farm.counts||!Array.isArray(farm.animals)||!Array.isArray(equipment))
    throw new TypeError("Original Farm snapshot is incomplete");

  const settings=world.operatingSettings||{};
  const config={...clone(legacy.config),
    backgroundLoadW:requireNonnegative("backgroundLoadW",settings.backgroundLoadW??legacy.config.backgroundLoadW),
    pumpElectricalW:requireNonnegative("pumpLoadW",settings.pumpLoadW??legacy.config.pumpElectricalW),
    waterStorageCapacityL:world.waterCapacityL};
  const pump=world.water?.parts?.find(part=>part.type==="pump_sky");
  if(!pump||!pump.params)throw new TypeError("Original Water pump not present");
  config.pumpPressurePsi=requireNonnegative("native Water pressure",pump.params.psi);
  // Renderer only needs a fractional battery bar. The displayed bar uses the
  // original Solar SoC; this visualization value is NOT available stored Wh.
  const visualBatteryWh=soc*requireNonnegative("visual battery scale",legacy.config.batteryCapacityWh);
  const clock={
    hours:world.clockMinute/60-startHour,startHour,
    hourOfDay:Math.floor(world.clockMinute/60)%24,
    date:farm.date
  };
  let last=null,nativeMeter=null;
  if(lastBatch?.ledger){
    if(!Array.isArray(lastBatch.ledger)||lastBatch.ledger.length<60)
      throw new TypeError("Native minute history must contain a complete recent hour");
    const records=lastBatch.ledger.slice(-60);
    if(records.some((v,i)=>!Number.isSafeInteger(v.minute) ||
       v.minute!==world.clockMinute-60+i))
      throw new RangeError("Native 3D ledger does not end at authoritative world clock");
    const demand=sum(records,"requestedWh");
    const served=sum(records,"deliveredWh");
    const baseRequested=sum(records,"baseRequestedWh"),waterRequested=sum(records,"waterRequestedWh"),
      farmRequested=sum(records,"farmRequestedWh");
    const baseServed=sum(records,"baseServedWh"),waterServed=sum(records,"waterServedWh"),
      farmServed=sum(records,"farmServedWh");
    const produced=sum(records,"waterDeliveredL"),consumed=sum(records,"waterConsumedL"),
      overflow=sum(records,"waterOverflowL");
    if(!close(demand,baseRequested+waterRequested+farmRequested)||
       !close(served,baseServed+waterServed+farmServed)||
       served>demand+1e-6||
       !close(records.at(-1).waterRemainingL,world.storedWaterL))
      throw new Error("Native scene metering fails source resource conservation");
    const pvControllerWh=records.reduce((total,row)=>
      total+requireNonnegative("original Solar MPPT output",
        row.native?.solar?.pvControllerWh??0),0);
    const animalWaterRequestedL=records.reduce((total,row)=>
      total+requireNonnegative("original Farm animal water",
        row.native?.farm?.waterRequiredL??0),0);
    const pumpEnabled=records.some(row=>row.native?.water?.pumpEnabled===true);
    nativeMeter={
      energyRequestedWh:demand,energyDeliveredWh:served,
      baseRequestedWh:baseRequested,baseServedWh:baseServed,
      waterRequestedWh:waterRequested,waterServedWh:waterServed,
      farmRequestedWh:farmRequested,farmServedWh:farmServed,
      pvControllerWh,waterProducedL:produced,waterConsumedL:consumed,
      waterOverflowL:overflow,waterStoredL:world.storedWaterL,
      farmWaterRequestedL:animalWaterRequestedL,pumpEnabled,
      solarSoc:soc,minutes:records.length
    };
    const electricalLoads={
      backgroundRequestedWh:baseRequested,backgroundServedWh:baseServed,
      backgroundDeficitWh:baseRequested-baseServed,
      pumpRequestedWh:waterRequested,pumpServedWh:waterServed,
      pumpDeficitWh:waterRequested-waterServed,
      farmRequestedWh:farmRequested,farmServedWh:farmServed,
      farmDeficitWh:farmRequested-farmServed,
      // Per-fixture attribution is not created from aggregate totals.
      equipment:[]
    };
    last={
      pv:{envelopeW:0},
      energy:{
        pvWh:pvControllerWh,servedBaseWh:baseServed,servedPumpWh:waterServed,
        servedFarmWh:farmServed,unservedBaseWh:baseRequested-baseServed,
        unservedFarmWh:farmRequested-farmServed,pumpEnabled,
        nativeBattery:null
      },
      water:{
        treatedL:produced,consumedL:consumed,overflowL:overflow,
        shortfallL:Math.max(0,animalWaterRequestedL-consumed)
      },
      farm:{
        waterDeliveredL:consumed,hourlyWaterDemandL:animalWaterRequestedL,
        electricityServedWh:farmServed,hourlyElectricityDemandWh:farmRequested,
        electricityDeficitWh:farmRequested-farmServed
      },
      electricalLoads,
      warnings:["Original-engine electrical dispatch and hydraulics are modeled, not field-calibrated. No potable water certification."]
    };
  }
  return {
    ...clone(legacy),model:"original-native-coupled-runtime",
    nativeOriginal:true,nativeMeter,
    nativeSolarSoc:soc,
    clock,config,farm,farmEquipment:equipment,
    batteryWh:visualBatteryWh,waterStoredL:world.storedWaterL,last
  };
}
