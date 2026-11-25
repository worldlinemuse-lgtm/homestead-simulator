import {editOriginalSolarSetting,SOLAR_FIELDS,originalBatteryCapacityWh} from "./native-equipment-edits.mjs";
import {bindNativeWorldViews} from "./native-world-view-binding.mjs";

/**
 * Browser-facing native execution console. Receives real original-engine
 * snapshots; does not compute or substitute any simulation results.
 * The scene and Utilities always observe the same controller revision.
 */
export function mountNativeWorldConsole({controller,scene,root,solarSim,onError=()=>{}}) {
  if (!root || typeof root.append !== "function")
    throw new TypeError("Native Utilities root element required");
  if (!scene || typeof scene.renderNativeWorld !== "function")
    throw new TypeError("Native scene adapter required");
  const doc=root.ownerDocument;
  const container=doc.createElement("section");
  container.className="nativeWorldConsole";
  const heading=doc.createElement("h3");
  heading.textContent="Original Solar → Water → Farm";
  const status=doc.createElement("output");
  status.setAttribute("aria-live","polite");
  const advance=doc.createElement("button");
  advance.type="button";
  advance.textContent="Advance native world 1 hour";
  const day=doc.createElement("button");
  day.type="button";
  day.textContent="Advance native world 24 hours";
  const exportButton=doc.createElement("button");
  exportButton.type="button";
  exportButton.textContent="Export last native minute ledger (CSV)";
  exportButton.disabled=true;
  const metering=doc.createElement("output");
  metering.setAttribute("aria-live","polite");
  const table=doc.createElement("dl");
  const settings=doc.createElement("form");
  settings.className="nativeWorldSettings";
  const controls=[
    ["waterCapacityL","Treated-water tank capacity (L)"],
    ["backgroundLoadW","Background electrical load (W)"],
    ["pumpLoadW","Pump nameplate load (W)"],
    ...[["tilt","Solar array tilt (°)"],["az","Solar array azimuth (°)"],["reserve","Battery reserve (%)"],["ser","PV panels per string"],["par","PV parallel strings"],["nMppt","MPPT controller count"],["shade","PV shading (%)"],["bpar","Battery parallel strings"]].filter(([key])=>Object.hasOwn(controller.snapshot().solar?.cfg||{},key))
  ];
  const inputs=new Map();
  for(const [key,title] of controls){
    const label=doc.createElement("label");
    label.textContent=title+" ";
    const input=doc.createElement("input");
    input.type="number";input.min="0";input.step="any";input.required=true;
    if(Object.hasOwn(SOLAR_FIELDS,key)){input.min=String(SOLAR_FIELDS[key][0]);input.max=String(SOLAR_FIELDS[key][1]);input.step="1";}
    if(key==="bpar"&&solarSim?.BATT)input.max=String(solarSim.BATT.maxPar);
    input.name=key;label.append(input);settings.append(label);
    inputs.set(key,input);
  }
  const save=doc.createElement("button");
  save.type="submit";save.textContent="Apply native equipment settings";
  settings.append(save);
  container.append(heading,status,advance,day,settings,exportButton,metering,table);
  root.append(container);
  let disposed=false;
  let latestMinute=null;
  let lastLedger=null;
  const csvHeader="minute,requestedWh,deliveredWh,baseServedWh,waterServedWh,farmServedWh,waterDeliveredL,waterConsumedL,waterOverflowL,waterRemainingL";
  const csvFields=csvHeader.split(",");
  const serializeLedger=ledger=>{
    if(!Array.isArray(ledger)||!ledger.length)throw new TypeError("Native minute ledger unavailable");
    return [csvHeader,...ledger.map((entry,index)=>{
      if(!Number.isSafeInteger(entry.minute)|| (index>0&&entry.minute!==ledger[index-1].minute+1))
        throw new RangeError("Native ledger minute chronology invalid");
      return csvFields.map(field=>{
        const value=entry[field];
        if(!Number.isFinite(value)||value<0)throw new RangeError("Invalid native CSV field: "+field);
        return String(value);
      }).join(",");
    })].join("\r\n")+"\r\n";
  };
  const utilities={
    renderNativeWorld(snapshot,revision){
      latestMinute=snapshot.clockMinute;
      if(typeof controller.lastBatch==="function" && controller.lastBatch()===null){lastLedger=null;exportButton.disabled=true;metering.textContent="";}
      // A committed external edit must refresh the form even if it has focus;
      // otherwise applying another field could restore obsolete native settings.
      {
        for(const [key,input] of inputs){
          const value=key==="waterCapacityL"?snapshot.waterCapacityL:Object.hasOwn(SOLAR_FIELDS,key)?snapshot.solar?.cfg?.[key]:snapshot.operatingSettings?.[key];
          if(Number.isFinite(value))input.value=String(value);
        }
      }
      const fields=[
        ["Revision",revision],
        ["World minute",snapshot.clockMinute],
        ["Treated water stored (L)",snapshot.storedWaterL],
        ["Treated water capacity (L)",snapshot.waterCapacityL],
        ["Original Solar state",snapshot.solar==null?"Unavailable":"Connected"],
        ["Original Water state",snapshot.water==null?"Unavailable":"Connected"],
        ["Original Farm state",snapshot.farm==null?"Unavailable":"Connected"]
      ];
      if(solarSim?.capWh&&snapshot.solar?.cfg){
        fields.push(["Original battery capacity (Wh)",originalBatteryCapacityWh(solarSim,snapshot.solar)],["PV panel count",snapshot.solar.cfg.ser*snapshot.solar.cfg.par]);
        const edit=snapshot.batteryInventoryEdits?.at(-1);
        if(edit)fields.push(["Last external battery inventory change (Wh)",edit.externalStoredWhDelta]);
      }
      table.replaceChildren();
      for(const [name,value] of fields){
        const dt=doc.createElement("dt"),dd=doc.createElement("dd");
        dt.textContent=name;dd.textContent=String(value);
        table.append(dt,dd);
      }
      status.textContent="Native world synchronized";
    }
  };
  let binding;
  try{
    binding=bindNativeWorldViews({controller,scene,utilities,onError});
  }catch(error){container.remove();throw error;}
  const runHours=(hours)=>{
    if(disposed)return;
    try{
      advance.disabled=day.disabled=true;
      // Always use the controller's authoritative clock, not a UI timer.
      const result=binding.advanceToMinute(binding.snapshot().clockMinute+hours*60,{includeLedger:true});
      // Export is enabled only for a fully verified chronological native ledger.
      const csv=serializeLedger(result.ledger);
      lastLedger=csv;
      exportButton.disabled=false;
      const totals=result.totals;
      const fmt=value=>Number(value).toFixed(2);
      metering.textContent=`Last ${hours} h · electricity ${fmt(totals.energyDeliveredWh)} Wh delivered / ${fmt(totals.energyRequestedWh)} Wh requested · water ${fmt(totals.waterProducedL)} L produced, ${fmt(totals.waterConsumedL)} L consumed, ${fmt(totals.waterOverflowL)} L overflow · ${fmt(totals.waterStoredL)} L stored`;
    }catch(error){
      status.textContent="Native advance failed: "+error.message;
      onError(error);
    }finally{advance.disabled=day.disabled=false;}
  };
  const onSettings=event=>{
    event.preventDefault();
    if(disposed)return;
    try{
      const values={};
      for(const [key,input] of inputs){
        const value=Number(input.value);
        if(input.value.trim()===""||!Number.isFinite(value)||value<0)
          throw new RangeError("Invalid native equipment setting: "+key);
        values[key]=value;
      }
      binding.editAsset("native-site-settings",draft=>{
        if(values.waterCapacityL<draft.storedWaterL)
          throw new RangeError("Tank capacity cannot be below stored water inventory");
        draft.waterCapacityL=values.waterCapacityL;
        draft.operatingSettings={...draft.operatingSettings,
          backgroundLoadW:values.backgroundLoadW,pumpLoadW:values.pumpLoadW};
        for(const key of Object.keys(SOLAR_FIELDS))if(Object.hasOwn(values,key))editOriginalSolarSetting(draft,key,values[key],solarSim);
        return draft;
      });
      lastLedger=null;exportButton.disabled=true;metering.textContent="";
      status.textContent="Native equipment settings committed";
    }catch(error){status.textContent="Native settings rejected: "+error.message;onError(error);}
  };
  settings.addEventListener("submit",onSettings);
  const onExport=()=>{
    if(disposed||lastLedger===null)return;
    const BlobType=doc.defaultView?.Blob ?? Blob;
    const blob=new BlobType([lastLedger],{type:"text/csv;charset=utf-8"});
    const url=doc.defaultView.URL.createObjectURL(blob);
    const anchor=doc.createElement("a");
    anchor.href=url;
    anchor.download="homestead-native-minute-ledger.csv";
    container.append(anchor);
    try{anchor.click();}finally{anchor.remove();doc.defaultView.URL.revokeObjectURL(url);}
  };
  exportButton.addEventListener("click",onExport);
  const onAdvance=()=>runHours(1);
  const onDay=()=>runHours(24);
  advance.addEventListener("click",onAdvance);
  day.addEventListener("click",onDay);
  return Object.freeze({
    snapshot:()=>binding.snapshot(),
    advanceToMinute:(minute,options)=>binding.advanceToMinute(minute,options),
    editAsset:(id,mutator)=>binding.editAsset(id,mutator),
    get clockMinute(){return latestMinute;},
    dispose(){
      if(disposed)return;
      disposed=true;
      exportButton.removeEventListener("click",onExport);
      settings.removeEventListener("submit",onSettings);
      lastLedger=null;
      advance.removeEventListener("click",onAdvance);
      day.removeEventListener("click",onDay);
      binding.dispose();
      container.remove();
    }
  });
}
