// Transactional native equipment edits. No substitute generation or biology.
export const SOLAR_FIELDS=Object.freeze({tilt:[0,90],az:[90,270],reserve:[0,80]});
export function editOriginalSolarSetting(draft,key,value){
  const range=Object.hasOwn(SOLAR_FIELDS,key)?SOLAR_FIELDS[key]:null;
  if(!range||!Number.isInteger(value)||value<range[0]||value>range[1])
    throw new RangeError("Invalid original Solar setting: "+key);
  if(!draft.solar?.cfg||!Object.hasOwn(draft.solar.cfg,key))
    throw new Error("Original Solar configuration missing "+key);
  // Source SIM.step reads these settings from cfg. No battery energy, topology,
  // catalog singleton, or calendar is changed by these operating settings.
  draft.solar.cfg[key]=value;
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
