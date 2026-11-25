// Transactional native equipment edits. No substitute generation or biology.
export const SOLAR_FIELDS=Object.freeze({tilt:[0,90],az:[90,270],reserve:[0,80],ser:[1,20],par:[1,20],nMppt:[1,8],shade:[0,90],bpar:[1,16]});
export function editOriginalSolarSetting(draft,key,value,sim){
  const range=Object.hasOwn(SOLAR_FIELDS,key)?SOLAR_FIELDS[key]:null;
  if(!range||!Number.isInteger(value)||value<range[0]||value>range[1])
    throw new RangeError("Invalid original Solar setting: "+key);
  if(!draft.solar?.cfg||!Object.hasOwn(draft.solar.cfg,key))
    throw new Error("Original Solar configuration missing "+key);
  const solar=draft.solar,cfg=solar.cfg;
  if(cfg[key]===value)return draft;
  if(key==="bpar"){
    if(!sim?.BATT||typeof sim.capWh!=="function"||sim.BATT.id!==cfg.batt)
      throw new Error("Original battery catalog unavailable");
    if(value>sim.BATT.maxPar)throw new RangeError("Original battery parallel-string limit exceeded");
    const before=originalBatteryCapacityWh(sim,solar);
    const next={...solar,cfg:{...cfg,bpar:value}};
    const after=originalBatteryCapacityWh(sim,next);
    if(!Number.isFinite(solar.soc)||solar.soc<0||solar.soc>1)throw new RangeError("Invalid source SoC");
    // Original stepBatts adds/removes strings at the existing charge fraction.
    // This is an external equipment inventory transfer, not solar generation.
    draft.batteryInventoryEdits=[...(draft.batteryInventoryEdits||[]),{
      minute:draft.clockMinute,fromStrings:cfg.bpar,toStrings:value,
      beforeCapacityWh:before,afterCapacityWh:after,
      externalStoredWhDelta:(after-before)*solar.soc
    }];
    solar.lastI=0;
  }
  if(["ser","par","nMppt"].includes(key))solar.mpptDead=false;
  cfg[key]=value;
  return draft;
}
export function editOriginalFarmEquipment(draft,farm,id,key,value){
  if(!draft.farm?.checkpoint||typeof farm?.setEquipmentParameter!=="function")
    throw new TypeError("Original Farm equipment editor unavailable");
  const before=structuredClone(farm.checkpoint());
  try{
    farm.restoreCheckpoint(structuredClone(draft.farm.checkpoint));
    const day=farm.snapshot().day;
    const edited=farm.setEquipmentParameter(id,key,value);
    if(!edited||String(edited.id)!==String(id)||farm.snapshot().day!==day)
      throw new Error("Original Farm equipment edit failed identity or day check");
    draft.farm.checkpoint=structuredClone(farm.checkpoint());
    // Prior deliveries remain metered: the new settings apply prospectively.
    return draft;
  }finally{farm.restoreCheckpoint(before);}
}

// Read source capacity without changing the running world's configuration.
export function originalBatteryCapacityWh(sim,solar){
  if(!sim?.S?.cfg||typeof sim.capWh!=="function"||!solar?.cfg||sim.BATT?.id!==solar.cfg.batt)
    throw new TypeError("Original battery capacity runtime unavailable");
  const previous=sim.S.cfg;
  try{
    sim.S.cfg=structuredClone(solar.cfg);
    const capacity=sim.capWh();
    if(!Number.isFinite(capacity)||capacity<=0)throw new RangeError("Invalid source battery capacity");
    return capacity;
  }finally{sim.S.cfg=previous;}
}
