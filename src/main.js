import {makeScene} from "./scene.js";
import {installFarmNativeStudy} from "./farm-study-ui.mjs";
import {nativeLedgerCsv} from "./native-ledger.mjs";
import {evaluateNativeSolarBattery,evaluateNativeSolarAgmSweep} from "./solar-battery-utility.mjs";
import {evaluateWaterPreset,evaluateWaterPresetComparison,evaluateWaterTimeToVolume,waterPresetNativeControls} from "./water-preset-utility.mjs";
import {UTILITY_CAPABILITIES,assertUtilityRegistry} from "./utility-registry.mjs";
import {seasonalSun} from "./seasonal-sun.mjs";
import {ScenarioTimeline,formatHour} from "./sim-clock.mjs";
import {enableOriginalNative3D} from "./native-3d-mode.mjs";
const $=id=>document.getElementById(id);
const fmt=(n,d=1)=>Number(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const solarClock=h=>{const minute=Math.round(h*60);return String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0")};
const coordinator=new window.HomesteadCoordinator.Coordinator();
let nativeMode=null,nativeStarting=false;
function activeSnapshot(){return nativeMode?nativeMode.snapshot():coordinator.snapshot();}
function stepAuthoritativeHour(){
  if(nativeStarting&&!nativeMode)throw new Error("Native source engines are still initializing");
  return nativeMode?nativeMode.stepHour():coordinator.stepHour();
}
// This is the ORIGINAL Farm world, running inside the same biological model closure.
// It has an independent seeded visual RNG and never writes numeric model results.
const farmVisual=window.HomesteadFarmCore.nativeVisual;
farmVisual.init(20261104,9);
// Whole-plot rigid transform (feet -> metres); not a modification of farm pen data.
const farmWorldOriginM=Object.freeze({x:23,y:0,z:6});
let selected="overview",playing=false,scene;
const timeline=new ScenarioTimeline(5);
let previousFrame=null,lastClockPaint=0;
let selectedAsset=null;
let selectedWaterRole=null;
let selectedFarmDeviceId=null,selectedFarmDeviceKey=null;
function fail(e){playing=false;scene?.setPlayback(false);$("playBtn").textContent="▶ Play";$("errors").textContent="Simulation stopped: "+(e?.message||e);$("errors").style.display="block";console.error(e);}
const descriptions={
 overview:["Whole homestead","Energy production, water treatment and animal demand connected through one chronological ledger."],
 energy:["Solar & battery","Four LONGi 435 W reference module representations. Battery dispatch is experimental, not manufacturer-calibrated."],
 water:["Water treatment","The original Water simulator's pump and reverse-osmosis hydraulic network advances treatment and storage. Electrical input is assumed."],
 farm:["Rabbit & chicken area","Rabbits, chickens and daily resource demands come from the original seeded Farm biological engine. Visual movement does not affect biology."]
};
function selectArea(kind,moveCamera=true){selected=kind in descriptions?kind:"overview";document.querySelectorAll("nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===selected));$("inspectTitle").textContent=descriptions[selected][0];$("inspectDescription").textContent=descriptions[selected][1];if(moveCamera)scene?.go(selected);}
function refreshObjectEditor(){
 if(!scene?.editor)return;
 const list=scene.editor.list(),current=scene.editor.selected();
 const sel=$("objectList"),old=sel.value;
 sel.replaceChildren();
 for(const item of list){const opt=document.createElement("option");
  opt.value=item.id;opt.textContent=item.label+(item.site?" · layout position":item.locked?" · native garden":" · "+item.type);
  sel.append(opt)}
 sel.value=current.id;
 $("objectRemove").disabled=current.locked;
 $("objectSwap").disabled=current.locked;
}
function editMessage(message,error=false){
 $("editStatus").textContent=message;$("editStatus").style.color=error?"#ffb8a5":"#bfe8ce";
}
function runEdit(operation){
 try{
  const result=operation();refreshObjectEditor();
  if(nativeMode){
    const item=scene?.editor?.selected();
    if(item?.id)nativeMode.selectSceneAsset(item.id);
  }
  editMessage(result?.label?"Selected "+result.label:"Visual layout updated");
  redraw(activeSnapshot());
 }catch(e){editMessage(e.message,true)}
}
function renderAsset(s){
 const target=$("assetReadout");if(!target)return;
 if(s.nativeOriginal&&selectedAsset){
   // Real original-engine source meters replace all legacy PV-envelope/battery
   // calculator readouts while native science owns the authoritative clock.
   const m=s.nativeMeter;
   const rows=[
     ["Native original engine","Solar SIM.step + Water hydraulic step + Farm biology"],
     ["Solar battery state of charge",fmt(s.nativeSolarSoc*100,1)+"%"],
     ["PV controller output",m?fmt(m.pvControllerWh,2)+" Wh this hour":"Awaiting minute dispatch"],
     ["AC delivery",m?fmt(m.energyDeliveredWh,2)+" / "+fmt(m.energyRequestedWh,2)+" Wh":"—"],
     ["Home electrical delivery",m?fmt(m.baseServedWh,2)+" / "+fmt(m.baseRequestedWh,2)+" Wh":"—"],
     ["Water pump delivery",m?fmt(m.waterServedWh,2)+" / "+fmt(m.waterRequestedWh,2)+" Wh":"—"],
     ["Farm electrical delivery",m?fmt(m.farmServedWh,2)+" / "+fmt(m.farmRequestedWh,2)+" Wh":"—"],
     ["Original Water pump PSI",fmt(s.config.pumpPressurePsi,1)+" psi · change via Live Utilities"],
     ["Native treated storage",fmt(s.waterStoredL,2)+" / "+fmt(s.config.waterStorageCapacityL,2)+" L"],
     ["Water produced / consumed",m?fmt(m.waterProducedL,2)+" / "+fmt(m.waterConsumedL,2)+" L":"—"],
     ["Native Farm animals",String(s.farm.counts.n)],
     ["Safety","Modeled original-engine outputs, not field calibrated or potable-water certification"]
   ];
   target.replaceChildren();
   for(const [name,value] of rows){
     const row=document.createElement("div"),label=document.createElement("span"),val=document.createElement("strong");
     row.className="assetRow";label.textContent=name;val.textContent=value;
     row.append(label,val);target.append(row);
   }
   return;
 }
 const l=s.last,e=l?.energy,w=l?.water,d=s.farm?.daily;
 const readouts={
  "Ground-mounted solar array":[
    ["Modules","4 × 435 W (reference identity)"],
    ["PV power envelope",l?fmt(l.pv.envelopeW,0)+" W":"No interval simulated"],
    ["Modeled supplied energy",l?fmt(e.pvWh,0)+" Wh this hour":"—"],
    ["Authority","Published-reference upper bound; delivered power is assumption-adjusted"]
  ],
  "Battery storage module":[
    ["Battery energy",fmt(s.batteryWh/1000,2)+" kWh (experimental live model)"],
    ["Native Solar chemistry",l?(e.nativeBattery.chemistry.toUpperCase()+" · "+fmt(e.nativeBattery.temperatureC,0)+" °C"):"Awaiting first hour"],
    ["Native discharge factor",l?fmt(e.nativeBattery.dischargeMultiplier,3)+" × at "+fmt(e.nativeBattery.dischargeCurrentA,2)+" A":"—"],
    ["Native charging phase",l?(e.nativeBattery.chargePhase+" · "+fmt(e.nativeBattery.chargeCurrentMultiplier,3)+" × taper"):"—"],
    ["Charging limit",l?fmt(e.nativeBattery.chargeLimitWh,1)+" Wh this hour":"—"],
    ["Native source","Original Solar battery chemistry/rate/temperature and absorption; scenario electrical assumptions remain"]
  ],
  "Solar inverter and battery":[
    ["Battery energy",fmt(s.batteryWh/1000,2)+" kWh"],
    ["Battery maximum",fmt(s.config.batteryCapacityWh/1000,1)+" kWh assumed"],
    ["Supply to site",l?fmt(e.servedBaseWh,1)+" Wh this hour":"—"],
    ["Battery discharge to loads",l?fmt(e.batteryBaseWh+e.batteryPumpWh,1)+" Wh":"—"],
    ["Battery charging",l?fmt(e.chargeStoredWh,1)+" Wh stored":"—"],
    ["Battery losses",l?fmt(e.dischargeLossWh+e.chargeLossWh,1)+" Wh":"—"],
    ["Authority","Original Solar battery rate and absorption functions; full inverter/MPPT dispatch not yet native"]
  ],
  "Home and utility loads":[
    ["Site background demand",fmt(s.config.backgroundLoadW,0)+" W assumed"],
    ["Demand served",l?fmt(e.servedBaseWh,1)+" Wh total":"—"],
    ["Unserved demand",l?fmt(e.unservedBaseWh,1)+" Wh":"—"],
    ["Background electricity",l?fmt(l.electricalLoads.backgroundServedWh,1)+"/"+fmt(l.electricalLoads.backgroundRequestedWh,1)+" Wh":"—"],
    ["Farm electricity",l?fmt(l.electricalLoads.farmServedWh,1)+"/"+fmt(l.electricalLoads.farmRequestedWh,1)+" Wh":"—"],
    ["Pump electricity",l?fmt(l.electricalLoads.pumpServedWh,1)+"/"+fmt(l.electricalLoads.pumpRequestedWh,1)+" Wh":"—"],
    ["Total electrical deficit",l?fmt(l.electricalLoads.backgroundDeficitWh+l.electricalLoads.farmDeficitWh+l.electricalLoads.pumpDeficitWh,1)+" Wh":"—"]
  ],
  "Water treatment and storage":[
    ["Pump energized",l?(e.pumpEnabled?"Yes":"No"):"Not run"],
    ["Pump electrical allocation",l?fmt(e.servedPumpWh,0)+" Wh":"—"],
    ["RO network treated output",l?fmt(w.treatedL,2)+" L this hour":"—"],
    ["Authority","Original Water hydraulic solver; pump watts assumed"]
  ],
  "Water pressure pump":[
    ["Pump energized",l?(e.pumpEnabled?"Yes":"No"):"Not run"],
    ["Electrical pump allocation",l?fmt(e.servedPumpWh,1)+" Wh":"—"],
    ["Live hydraulic pressure",fmt(s.config.pumpPressurePsi,0)+" psi configured · "+(l?(e.pumpEnabled?"energized":"power-gated"):"awaiting next step")],
    ["Original source solver","The live pump uses the configured pressure during the next simulated hour"],
    ["Live pump sizing","Assumed electrical demand, not source catalog calibration"]
  ],
  "Reverse-osmosis treatment stage":[
    ["Source hydraulic output",l?fmt(w.treatedL,2)+" L":"Not run"],
    ["Original source study","RO drain in liters per liter produced is independently editable"],
    ["Field safety","Neither treatment quality nor potable water is certified"]
  ],
  "Treated-water storage tank":[
    ["Stored treated water",fmt(s.waterStoredL,1)+" L"],
    ["Scenario capacity",fmt(s.config.waterStorageCapacityL,0)+" L"],
    ["Overflow",l?fmt(w.overflowL,2)+" L":"—"],
    ["Potability","Not certified safe for drinking"]
  ],
  "Livestock waterer":[
    ["Farm delivery",l?fmt(w.consumedL,2)+" L":"—"],
    ["Unmet demand",l?fmt(w.shortfallL,2)+" L":"—"],
    ["Hourly modeled demand",l?fmt(l.farm.hourlyWaterDemandL,2)+" L":"—"],
    ["Cumulative farm water delivered",fmt(s.cumulative.farmWaterDeliveredL||0,2)+" L"],
    ["Cumulative farm water deficit",fmt(s.cumulative.farmWaterDeficitL||0,2)+" L"],
    ["Daily modeled demand",fmt(d?.waterGal||0,2)+" US gal"]
  ],
  "Henhouse":[
    ["Chickens, all ages",s.farm.animals.filter(a=>a.sp==="chicken").length],
    ["Native Farm electricity requested/day",fmt(d?.nativeElectricityRequestedKWh??d?.kWh??0,2)+" kWh"],
    ["Farm electricity served",l?fmt(l.farm.electricityServedWh,1)+" Wh this hour":"—"],
    ["Farm electricity unmet",l?fmt(l.farm.electricityDeficitWh,1)+" Wh this hour":"—"],
    ["Eggs in last simulated day",d?.eggs??0],
    ["Shortage effects","Native delivered water and fixture electricity affect Farm daily biology; intermittent incubation is not calibrated"]
  ],
  "Rabbit hutches":[
    ["Rabbits, all ages",s.farm.animals.filter(a=>a.sp==="rabbit").length],
    ["Farm demand/day",fmt(d?.waterGal||0,2)+" gal total"],
    ["Shortage effects","Native delivered water and fixture electricity affect Farm daily biology; intermittent incubation is not calibrated"]
  ],
  "Pasture, hutches and livestock":[
    ["Animals",s.farm.counts.n],
    ["Animal water/day",fmt(d?.waterGal||0,2)+" gal"],
    ["Site farm power/day",fmt(d?.kWh||0,2)+" kWh"]
  ],
  "Pasture forage patch":[
    ["Status","Landscape demonstration only"],
    ["Food output","Not simulated by Farm engine"],
    ["Scope","Rabbit and chicken model remains authoritative"]
  ]
 };
 let entries=selectedAsset?readouts[selectedAsset]:null;
 if(selectedAsset?.startsWith("Visual prop ")){
   const p=scene?.editor?.list().find(x=>x.label===selectedAsset);
   if(p)entries=[["Appearance",p.type],["World X",fmt(p.x,1)+" m"],
     ["World Z",fmt(p.z,1)+" m"],["Model coupling","Visual only; no resource or biology changes"]];
 }
 const animalMatch=/^(Rabbit|Chicken) #(\d+)$/.exec(selectedAsset||"");
 if(animalMatch){
   const id=Number(animalMatch[2]);
   const a=(s.farm.animals||[]).find(x=>Number(x.id)===id);
   if(a)entries=[
     ["Model animal ID",a.id],["Species",a.sp],
     ["Life stage",a.st],["Modeled health",Number.isFinite(a.health)?fmt(a.health,1):"Unavailable"],
     ["Assigned enclosure",a.enc??"Unassigned"],
     ["Native visual action",farmVisual.world().agents.get(id)?.act??"Idle"],
     ["Authority","Original Farm biology and native visual controller; movement/actions are illustrative"]
   ];
 }

 // Source-native fixture IDs and metered deliveries, shared by 3D and Utilities.
 if(entries && ["Henhouse","Rabbit hutches","Pasture, hutches and livestock"].includes(selectedAsset)){
   const devices=s.farmEquipment||[];
   const metered=s.last?.electricalLoads?.equipment||[];
   const byId=new Map(metered.map(device=>[String(device.id),device]));
   const relevant=devices.filter(device=>{
     if(selectedAsset==="Rabbit hutches")return device.type==="hutch"||device.type==="heater";
     if(selectedAsset==="Henhouse")return device.type!=="hutch";
     return true;
   });
   entries.push(["Native Farm fixtures",relevant.length+" equipment components"]);
   const totals=relevant.reduce((v,d)=>{
     const usage=byId.get(String(d.id));
     v.demand+=usage?.requestedWh||0;
     v.served+=usage?.servedWh||0;
     return v;
   },{demand:0,served:0});
   entries.push(["Metered equipment delivery",s.last?
     fmt(totals.served,2)+" / "+fmt(totals.demand,2)+" Wh this hour":"Awaiting next simulated hour"]);
   for(const device of relevant.slice(0,16)){
     const usage=byId.get(String(device.id));
     entries.push([device.type+" #"+device.id,
       fmt(device.nativeDailyDemandWh||0,1)+" Wh native daily demand · "+
       (usage?(fmt(usage.servedWh,1)+"/"+fmt(usage.requestedWh,1)+" Wh delivered"):"not yet dispatched")]);
   }
   if(relevant.length>16)entries.push(["Other native fixtures",String(relevant.length-16)+" additional"]);
 }
 target.replaceChildren();
 if(!entries){const p=document.createElement("p");p.textContent="Select a building, PV array, water component, or animal area to see its model-driven connections.";target.append(p);return}
 for(const [k,v] of entries){
   const row=document.createElement("div");row.className="assetRow";
   const label=document.createElement("span");label.textContent=k;
   const val=document.createElement("strong");val.textContent=String(v);
 
  row.append(label,val);target.append(row);
 }
 // Select a native component of the clicked 3D Farm area and edit its ORIGINAL
 // equipment fields, using the same coordinator as the top-level Utilities.
 if(entries && ["Henhouse","Rabbit hutches","Pasture, hutches and livestock"].includes(selectedAsset)){
   const available=(s.farmEquipment||[]).filter(d=>
     selectedAsset==="Rabbit hutches" ? (d.type==="hutch"||d.type==="heater") :
     selectedAsset==="Henhouse" ? d.type!=="hutch" : true);
   const fields={
     hutch:["lights","lightHours","lightWatts"],
     coop:["lights","lightHours","lightWatts"],
     fan:["watts","trigger"],heater:["watts","setpoint"],
     brooder:["lampWatts"],incubator:["on","watts","setpoint"]
   };
   if(available.length){
     let device=available.find(d=>String(d.id)===String(selectedFarmDeviceId))||available[0];
     selectedFarmDeviceId=String(device.id);
     const settings=fields[device.type]||[];
     if(!settings.includes(selectedFarmDeviceKey))selectedFarmDeviceKey=settings[0];
     const panel=document.createElement("div");panel.className="farmNativeSettings";
     panel.style.cssText="padding:10px;margin:10px 0;border:1px solid #82969a55;border-radius:9px;display:grid;gap:7px";
     const heading=document.createElement("strong");heading.textContent="Edit original Farm equipment";panel.append(heading);
     const makeLabel=(label,control)=>{const wrap=document.createElement("label");
       wrap.style.cssText="display:grid;gap:3px;font-size:12px";wrap.textContent=label;wrap.append(control);panel.append(wrap);};
     const selector=document.createElement("select");selector.setAttribute("aria-label","Original Farm equipment");
     for(const d of available){const option=document.createElement("option");
       option.value=String(d.id);option.textContent=d.type+" #"+d.id;selector.append(option);}
     selector.value=selectedFarmDeviceId;
     selector.addEventListener("change",()=>{selectedFarmDeviceId=selector.value;
       selectedFarmDeviceKey=null;renderAsset(activeSnapshot());});
     makeLabel("Native equipment ID",selector);
     const field=document.createElement("select");field.setAttribute("aria-label","Original Farm equipment property");
     for(const key of settings){const option=document.createElement("option");
       option.value=key;option.textContent=key;field.append(option);}
     field.value=selectedFarmDeviceKey;
     field.addEventListener("change",()=>{selectedFarmDeviceKey=field.value;renderAsset(activeSnapshot());});
     makeLabel("Native setting",field);
     const input=document.createElement("input");input.type="number";input.step="any";
     input.value=String(Number(device[selectedFarmDeviceKey])||0);
     input.setAttribute("aria-label","Native Farm setting value");
     makeLabel("Value (native units)",input);
     const apply=document.createElement("button");apply.type="button";apply.textContent="Apply to connected Homestead";
     apply.addEventListener("click",()=>{
       try{
         const value=Number(input.value);
         if(!input.value.trim() || !Number.isFinite(value))throw new Error("Enter a finite numeric value");
         const result=coordinator.setFarmEquipmentParameter(selector.value,field.value,value);
         redraw(result);
       }catch(err){editMessage(err.message,true);}
     });
     panel.append(apply);target.append(panel);
   }
 }
}

function redraw(s){
 if(s.nativeOriginal){
   // The scene uses its existing selectable geometry and native Farm animal
   // aggregates. Do not inject the old Farm visual RNG's physical positions.
   scene?.update({...s,farmWorld:null,farmWorldOriginM});renderAsset(s);
   const m=s.nativeMeter;
   $("energyValue").textContent=fmt(s.nativeSolarSoc*100,1)+"% SoC";
   $("energyDetail").textContent=m?
     "Original Solar MPPT "+fmt(m.pvControllerWh,2)+" Wh · AC "+fmt(m.energyDeliveredWh,2)+"/"+fmt(m.energyRequestedWh,2)+" Wh":
     "Original Solar dispatcher ready · advance native time to meter supply";
   $("waterValue").textContent=fmt(s.waterStoredL,1)+" L";
   $("waterDetail").textContent=m?
     "Native hydraulic output "+fmt(m.waterProducedL,2)+" L · farm water "+fmt(m.waterConsumedL,2)+" L":
     "Original Water solver ready · untreated water is not certified potable";
   $("farmValue").textContent=s.farm.counts.n+" animals";
   $("farmDetail").textContent=m?
     "Original Farm "+fmt(m.farmServedWh,2)+"/"+fmt(m.farmRequestedWh,2)+" Wh · "+
       fmt(m.waterConsumedL,2)+" L delivered":
     "Original Farm biological model ready";
   updateVisibleClock(s);
   $("alerts").textContent="Native engines active in development preview. Original science remains assumption-sensitive and is not field calibrated.";
   return;
 }
 farmVisual.sync(s.clock.hourOfDay);
 scene?.update({...s,farmWorld:farmVisual.world(),farmWorldOriginM});renderAsset(s);
 const e=s.last?.energy,w=s.last?.water,f=s.farm;
 $("energyValue").textContent=fmt(s.batteryWh/1000,2)+" kWh";
 $("energyDetail").textContent=e?"PV "+fmt(e.pvWh/1000,2)+" kWh/h · loads "+fmt(s.last.electricalLoads.backgroundServedWh+s.last.electricalLoads.farmServedWh+s.last.electricalLoads.pumpServedWh,0)+" Wh delivered · "+fmt(s.last.electricalLoads.backgroundDeficitWh+s.last.electricalLoads.farmDeficitWh+s.last.electricalLoads.pumpDeficitWh,0)+" Wh unmet · "+(e.pumpEnabled?"pump on":"pump off"):"Battery remaining · awaiting interval";
 $("waterValue").textContent=fmt(s.waterStoredL,0)+" L";
 $("waterDetail").textContent=w?"Modeled treated "+fmt(w.treatedL,1)+" L/h · farm use "+fmt(w.consumedL,1)+" L":"Treated storage, not certified drinking water";
 $("farmValue").textContent=f.counts.n+" animals";
 $("farmDetail").textContent=s.last?"This hour: "+fmt(s.last.farm.waterDeliveredL,1)+"/"+fmt(s.last.farm.hourlyWaterDemandL,1)+" L water · "+fmt(s.last.farm.electricityServedWh,1)+"/"+fmt(s.last.farm.hourlyElectricityDemandWh,1)+" Wh electricity":"Daily "+fmt(f.daily?.waterGal||0,1)+" gal water · "+fmt(f.daily?.kWh||0,2)+" kWh · "+(f.daily?.eggs||0)+" eggs";
 updateVisibleClock(s);
 $("alerts").textContent=s.last?.warnings.length?s.last.warnings.join(" "):"See Details for the model assumptions and limitations.";
}
function updateVisibleClock(s=activeSnapshot()){
 const view=timeline.display(s);
 const visualMinute=Math.min(1439,Math.floor(view.minuteOfDay+1e-7));
 $("simDate").textContent=view.date+" · "+formatHour(view.hour)+(view.preview?" · Preview":"");
 const sun=seasonalSun(view.date,view.hour);
 $("simPhase").textContent=(view.preview?"Lighting preview only · ":"")+"Daylight "+
   fmt(sun.dayLengthHours,1)+"h · Sunrise "+solarClock(sun.sunriseHour)+
   " · Sunset "+solarClock(sun.sunsetHour);
 $("timeSlider").value=String(visualMinute);
 $("timeValue").textContent=formatHour(view.hour);
 $("timeMode").textContent=view.preview?"Preview only · model stays at "+String(view.modelHour).padStart(2,"0")+":00":"Model steps hourly · lighting moves every minute";
 scene?.setVisualClock(view.date,view.hour);
}
function advanceMinutes(minutes){
 try{
   $("errors").style.display="none";
   timeline.advance(minutes,()=>stepAuthoritativeHour());
   redraw(activeSnapshot());
 }catch(e){fail(e)}
}
function stop(){playing=false;scene?.setPlayback(false);$("playBtn").textContent="▶ Play"}
function toggle(){
 if(playing){stop();return}
 timeline.resume();playing=true;previousFrame=null;
 scene?.setPlayback(true);$("playBtn").textContent="Ⅱ Pause";
 updateVisibleClock();
}
function clockFrame(now){
 requestAnimationFrame(clockFrame);
 if(playing){
   const seconds=previousFrame===null?0:Math.max(0,Math.min(.25,(now-previousFrame)/1000));
   try{
     const stepped=timeline.advanceRealSeconds(document.hidden?0:seconds,
       ()=>stepAuthoritativeHour());
     if(stepped)redraw(activeSnapshot());
   }catch(e){fail(e)}
 }
 previousFrame=now;
 if(now-lastClockPaint>=70){
   lastClockPaint=now;
   if(scene)updateVisibleClock();
 }
}
requestAnimationFrame(clockFrame);
$("playBtn").addEventListener("click",toggle);
for(const [id,minutes] of [["minuteBtn",1],["quarterBtn",15],["stepBtn",60],["dayBtn",1440]]){
 $(id).addEventListener("click",()=>{stop();advanceMinutes(minutes)});
}
$("speedSelect").addEventListener("change",()=>{
 try{timeline.setSpeed(Number($("speedSelect").value));updateVisibleClock()}
 catch(e){fail(e)}
});
$("timeSlider").addEventListener("input",()=>{
 stop();try{timeline.preview(Number($("timeSlider").value));updateVisibleClock()}
 catch(e){fail(e)}
});
$("timeResume").addEventListener("click",()=>{stop();timeline.resume();updateVisibleClock()});
function resetScenario(){
  if(nativeMode){window.location.reload();return nativeMode.snapshot();}
  scene?.editor?.reset();
  refreshObjectEditor();
  const next=coordinator.reset();
  timeline.reset();
  farmVisual.init(20261104,next.clock.hourOfDay);
  redraw(next);
  return next;
}
$("resetBtn").addEventListener("click",()=>{stop();try{resetScenario();$("errors").style.display="none"}catch(e){fail(e)}});
document.querySelectorAll("nav [data-view]").forEach(b=>b.addEventListener("click",()=>{selectedAsset=b.dataset.view==="farm"?"Henhouse":null;selectArea(b.dataset.view);$("sceneHint").textContent=selected==="farm"
  ?"Tap an animal to follow · Drag to orbit · Pinch to zoom"
  :"Drag to orbit · Pinch to zoom · Select equipment";renderAsset(activeSnapshot())}));
// Navigation is generated from the executable capability registry. A source
// calculator is never presented as a live scene control; unavailable tools
// are labeled, never exposed as fake clickable actions.
function setInspectorOpen(open){
 $("inspector").classList.toggle("open",open);
 for(const id of ["inspectBtn","utilitiesBtn"])
  $(id).setAttribute("aria-expanded",String(open));
}
function jumpToUtility(sectionId){
 const section=$(sectionId);
 if(!section)throw new Error("Registered utility section not found: "+sectionId);
 setInspectorOpen(true);
 // A utility route must not inherit the title of a previously selected 3D asset.
 // Keep the scene selection intact; this heading describes the active tool.
 const headingId=section.getAttribute("aria-labelledby");
 const heading=headingId?$(headingId):null;
 if(heading){
  $("inspectTitle").textContent=heading.textContent.trim();
  const scope=section.querySelector(".utilityScope");
  $("inspectDescription").textContent=scope?.textContent.trim()||"Select and configure this utility.";
 }else if(sectionId==="assetReadout"&&selectedAsset){
  $("inspectTitle").textContent=selectedAsset;
  $("inspectDescription").textContent=descriptions[selected][1];
 }
 section.scrollIntoView({block:"start",behavior:"auto"});
 section.focus({preventScroll:true});
}
function renderUtilityDirectory(search=""){
 assertUtilityRegistry();
 const term=String(search).trim().toLocaleLowerCase("en-US");
 const host=$("nativeUtilityList");
 const priority={Water:0,Solar:1,Farm:2,Exports:3};
 const found=UTILITY_CAPABILITIES.filter(c=>
  [c.title,c.purpose,c.category,c.scope].some(value=>value.toLocaleLowerCase("en-US").includes(term)))
  .sort((a,b)=>priority[a.category]-priority[b.category]||a.title.localeCompare(b.title));
 host.replaceChildren();
 for(const capability of found){
  const entry=document.createElement("div");
  entry.className="nativeUtilityEntry";
  entry.setAttribute("role","listitem");
  const button=document.createElement("button");
  button.type="button";
  button.dataset.utilityId=capability.id;
  button.setAttribute("aria-label","Open "+capability.title);
  const heading=document.createElement("strong");
  heading.textContent=capability.category+" · "+capability.title;
  const description=document.createElement("small");
  description.textContent=capability.purpose;
  button.append(heading,description);
  button.addEventListener("click",()=>jumpToUtility(capability.uiSection));
  const scope=document.createElement("p");
  scope.className="utilityScope";
  scope.textContent=capability.scope;
  entry.append(button,scope);
  host.append(entry);
 }
 $("nativeUtilityEmpty").hidden=found.length!==0;
 return found.length;
}
renderUtilityDirectory();
$("nativeUtilitySearch").addEventListener("input",()=>
 renderUtilityDirectory($("nativeUtilitySearch").value));
$("nativeUtilitySearch").addEventListener("keydown",event=>{
 if(event.key==="Enter"){
  const first=$("nativeUtilityList").querySelector("button");
  if(first){event.preventDefault();first.click();}
 }
});
$("utilitiesBtn").addEventListener("click",()=>{
 // The global directory is object-independent; retain the selected scene asset
 // but clear a previous source-study role so unrelated tools are not filtered.
 selectedWaterRole=null;
 $("waterAssetReturn").hidden=true;
 $("solarBatteryReturn").hidden=true;
 $("farmStudyReturn").hidden=true;
 jumpToUtility("utilityHub");
});
$("utilityLiveShortcut").addEventListener("click",()=>jumpToUtility("scenarioControls"));
$("utilityLayoutShortcut").addEventListener("click",()=>jumpToUtility("objectEditor"));
$("inspectBtn").addEventListener("click",()=>setInspectorOpen(!$("inspector").classList.contains("open")));
$("hudToggle").addEventListener("click",()=>{const collapsed=$("summary").classList.toggle("collapsed");$("hudToggle").setAttribute("aria-expanded",String(!collapsed));$("hudToggle").setAttribute("aria-label",collapsed?"Expand resource summary":"Collapse resource summary");});
// Keep the living landscape visible on narrow phones; all readings remain one tap away.
if(window.matchMedia("(max-width: 650px)").matches){
 $("summary").classList.add("collapsed");
 $("hudToggle").setAttribute("aria-expanded","false");
 $("hudToggle").setAttribute("aria-label","Expand resource summary");
}
$("closeInspector").addEventListener("click",()=>setInspectorOpen(false));
$("editMode").checked=true;
$("editMode").addEventListener("change",()=>{
 scene?.editor?.setEditMode($("editMode").checked);
 editMessage($("editMode").checked?"Click or touch an object, then drag it to move":"Layout dragging is disabled");
});
$("objectList").addEventListener("change",()=>runEdit(()=>scene.editor.select($("objectList").value)));
$("objectAdd").addEventListener("click",()=>{
 try{
  const part=scene.editor.beginPlace($("objectType").value);
  editMessage("Tap or click the ground to place "+part+"; Escape cancels");
  setInspectorOpen(false);
 }catch(e){editMessage(e.message,true)}
});
$("objectSwap").addEventListener("click",()=>runEdit(()=>scene.editor.swap($("objectType").value)));
$("objectRemove").addEventListener("click",()=>runEdit(()=>scene.editor.remove()));
$("objectUndo").addEventListener("click",()=>runEdit(()=>scene.editor.undo()));
for(const [id,dx,dz] of [["objectLeft",-1,0],["objectRight",1,0],
 ["objectUp",0,-1],["objectDown",0,1]]){
 $(id).addEventListener("click",()=>runEdit(()=>scene.editor.move(dx,dz)));
}
$("objectRotate").addEventListener("click",()=>runEdit(()=>scene.editor.rotate(Math.PI/2)));
for(const [id,out,key,fn] of [["cloud","cloudOut","cloudTransmittance",x=>fmt(x*100,0)+"%"],["houseLoad","houseLoadOut","backgroundLoadW",x=>fmt(x,0)+" W"],["pumpLoad","pumpLoadOut","pumpElectricalW",x=>fmt(x,0)+" W"],["pumpPressure","pumpPressureOut","pumpPressurePsi",x=>fmt(x,0)+" psi"]]){
 $(id).addEventListener("input",()=>{
   const raw=Number($(id).value),v=id==="cloud"?raw/100:raw;
   $(out).textContent=fn(v);
   try{
     if(nativeMode){
       if(id==="cloud")throw new Error("Source Solar shading has no verified native setting exposed here");
       if(id==="pumpPressure")nativeMode.editPumpPressure(v);
       else nativeMode.configurePower(id==="houseLoad"?"backgroundLoadW":"pumpLoadW",v);
       redraw(activeSnapshot());
     }else redraw(coordinator.configure({[key]:v}));
   }catch(e){fail(e)}
 })
}

// Live weather is validated atomically by the shared coordinator; failed input leaves state unchanged.
function syncLiveSolarWeather(){
 const series=activeSnapshot().config.solarHourlyWeather;
 $("solarWeatherJson").value=series?JSON.stringify(series,null,2):"";
 $("solarWeatherStatus").textContent=series?
   series.length+" hourly records ("+(series.length/24)+" days) active in the coupled world.":
   "Illustrative sky active; no supplied weather series.";
}
$("solarWeatherApply").addEventListener("click",()=>{
 try{
  const records=JSON.parse($("solarWeatherJson").value);
  const next=coordinator.configure({solarHourlyWeather:records});
  redraw(next);syncLiveSolarWeather();
 }catch(error){$("solarWeatherStatus").textContent="Weather not applied: "+error.message;}
});
$("solarWeatherClear").addEventListener("click",()=>{
 try{redraw(coordinator.configure({solarHourlyWeather:null}));syncLiveSolarWeather();}
 catch(error){$("solarWeatherStatus").textContent="Weather not cleared: "+error.message;}
});
syncLiveSolarWeather();

const farmStudyUI=installFarmNativeStudy({$,coordinator,isPlaying:()=>playing,jumpToUtility,fmt,
 onLiveUpdate:state=>redraw(state),
 focusFarm:()=>{
  if(!scene)throw new Error("Original Farm 3D scene unavailable");
  scene.go("farmStudy");setInspectorOpen(false);
  $("sceneHint").textContent="Farm equipment in view · select the real building to open native biological controls";
 }});
let lastSolarBatteryStudy=null,lastSolarSweep=null;
const solarInputIds=["solarBatteryChem","solarBatteryCurrentA","solarBatteryTempC","solarBatterySoc",
 "solarBatteryAbsMin","solarBatteryBankAh","solarBatteryHeatMode"];
function invalidateSolarBatteryStudy(){
 lastSolarBatteryStudy=null;lastSolarSweep=null;
 $("solarBatterySweepReport").dataset.resultState="none";
 $("solarBatterySweepReport").textContent="Source-table inputs changed. Run the AGM comparison again.";
 const panel=$("solarBatteryReport");
 panel.dataset.resultState="none";
 panel.textContent="Battery inputs changed. Run the original Solar calculation; live Homestead resources are unchanged.";
}
for(const id of solarInputIds){
 $(id).addEventListener("input",invalidateSolarBatteryStudy);
 $(id).addEventListener("change",invalidateSolarBatteryStudy);
}

$("solarBatterySweepRun").addEventListener("click",()=>{
 const panel=$("solarBatterySweepReport");
 try{
  const raw=$("solarBatteryTempC").value.trim();
  const tempC=raw===""?NaN:Number(raw);
  const result=evaluateNativeSolarAgmSweep(window.BATTMODEL,{tempC});
  lastSolarSweep=result;panel.replaceChildren();
  panel.dataset.resultState="complete";
  const heading=document.createElement("h4");
  heading.textContent="Original Renogy AGM table · "+fmt(tempC,1)+" °C";
  panel.append(heading);
  const subtitle=document.createElement("p");
  subtitle.textContent="Every point is an original Solar model evaluation at a manufacturer table current, not a newly fitted curve.";
  panel.append(subtitle);
  const svgNs="http://www.w3.org/2000/svg";
  const plot=document.createElementNS(svgNs,"svg");
  plot.setAttribute("class","solarSourceChart");
  plot.setAttribute("viewBox","0 0 350 176");
  plot.setAttribute("role","img");
  plot.setAttribute("aria-label","Source AGM drain multiplier by discharge current in amperes");
  const maxCurrent=Math.max(...result.points.map(p=>p.currentA));
  const minCurrent=Math.min(...result.points.map(p=>p.currentA));
  const maxMultiplier=Math.max(1,...result.points.map(p=>p.drainMultiplier));
  const position=p=>({
   x:25+300*(p.currentA-minCurrent)/Math.max(.001,maxCurrent-minCurrent),
   y:145-110*p.drainMultiplier/maxMultiplier
  });
  const line=document.createElementNS(svgNs,"polyline");
  line.setAttribute("fill","none");line.setAttribute("stroke","#b4e9cc");
  line.setAttribute("stroke-width","2.5");
  line.setAttribute("points",result.points.map(p=>{const t=position(p);return t.x+","+t.y}).join(" "));
  plot.append(line);
  for(const p of result.points){
   const t=position(p),circle=document.createElementNS(svgNs,"circle");
   circle.setAttribute("cx",String(t.x));circle.setAttribute("cy",String(t.y));
   circle.setAttribute("r","4");circle.setAttribute("fill","#ebc76c");
   const title=document.createElementNS(svgNs,"title");
   title.textContent=p.currentA+" A → "+fmt(p.drainMultiplier,3)+"×";
   circle.append(title);plot.append(circle);
  }
  const caption=document.createElementNS(svgNs,"text");
  caption.setAttribute("x","175");caption.setAttribute("y","167");
  caption.setAttribute("fill","#d7e5ea");caption.setAttribute("text-anchor","middle");
  caption.setAttribute("font-size","12");
  caption.textContent="Discharge current (A) →";plot.append(caption);panel.append(plot);
  const table=document.createElement("table");table.className="solarSourceTable";
  const head=document.createElement("thead"),headRow=document.createElement("tr");
  for(const label of ["Current (A)","Source rated (h)","Capacity (Ah)","Drain multiplier"]){
   const th=document.createElement("th");th.textContent=label;headRow.append(th);
  }head.append(headRow);table.append(head);
  const body=document.createElement("tbody");
  for(const p of result.points){
   const row=document.createElement("tr");
   for(const value of [fmt(p.currentA,2),fmt(p.sourceRatedHours,2),fmt(p.availableAh,2),fmt(p.drainMultiplier,4)+"×"]){
    const cell=document.createElement("td");cell.textContent=value;row.append(cell);
   }body.append(row);
  }table.append(body);panel.append(table);
  const limit=document.createElement("p");limit.className="utilityResultCaution";
  limit.textContent=result.limitations.join(" ");panel.append(limit);
 }catch(error){
  lastSolarSweep=null;panel.dataset.resultState="error";
  panel.textContent="Original AGM table comparison rejected: "+(error?.message||error);
 }
});
$("solarBatteryReturn").addEventListener("click",()=>jumpToUtility("assetReadout"));
$("solarBatteryFocus").addEventListener("click",()=>{
 if(!scene)throw new Error("3D battery scene is not initialized");
 scene.go("battery");
 setInspectorOpen(false);
 $("sceneHint").textContent="3D battery in view · Tap the battery enclosure to open its original Solar engineering controls";
});
$("solarBatteryRun").addEventListener("click",()=>{
 const report=$("solarBatteryReport");
 try{
  const num=id=>{const raw=$(id).value.trim();return raw===""?NaN:Number(raw)};
  const result=evaluateNativeSolarBattery(window.BATTMODEL,{
   chem:$("solarBatteryChem").value,
   currentA:num("solarBatteryCurrentA"),tempC:num("solarBatteryTempC"),
   socPercent:num("solarBatterySoc"),absorptionMinutes:num("solarBatteryAbsMin"),
   bankAh:num("solarBatteryBankAh"),heatMode:$("solarBatteryHeatMode").value
  });
  lastSolarBatteryStudy=result;
  report.replaceChildren();report.dataset.resultState="complete";
  const h=document.createElement("h4");h.textContent="Original Solar battery model results";report.append(h);
  const details=document.createElement("dl");details.className="utilityResultsDetails";
  const rows=[
   ["Source chemistry",result.inputs.chem==="agm"?"Renogy AGM":"LFP (source has no rate/temperature capacity derating)"],
   ["Source drain multiplier",fmt(result.discharge.m,4)+" ×"],
   ["Current-rate factor",fmt(result.discharge.rate,4)+" ×"],
   ["Temperature factor",fmt(result.discharge.temp,4)+" ×"],
   ["AGM capacity at selected discharge",result.agmAtCurrent?fmt(result.agmAtCurrent.ah,2)+" Ah":"Not characterized in source LFP model"],
   ["Charging phase",result.charging.phase],
   ["Charging-current multiplier",fmt(result.charging.mult,4)+" ×"],
   ["Absorption hold limit",result.charging.limit==null?"No source-defined limit":fmt(result.charging.limit,1)+" min"],
   ["Self-heating time to 5 °C",result.heating?fmt(result.heating.minutesTo5C,1)+" min":"Heater not selected"],
   ["Source revision",result.source.path+" @ "+result.source.revision.slice(0,12)]
  ];
  for(const [key,value] of rows){
   const dt=document.createElement("dt");dt.textContent=key;
   const dd=document.createElement("dd");dd.textContent=value;
   details.append(dt,dd);
  }
  report.append(details);
  const note=document.createElement("p");note.className="utilityResultCaution";
  note.textContent="Independent source-model calculation; live battery Wh, electrical dispatch, water and timeline are unchanged.";
  report.append(note);
  if(result.warnings.length){
   const list=document.createElement("ul");
   for(const warning of result.warnings){
    const item=document.createElement("li");item.textContent=warning;list.append(item);
   }
   report.append(list);
  }
 }catch(error){
  lastSolarBatteryStudy=null;report.dataset.resultState="error";
  report.textContent="Original Solar battery study rejected: "+(error?.message||error);
 }
});
let lastWaterPreset=null,lastWaterComparison=null;
function invalidateWaterStudy(){
 lastWaterPreset=null;
 $("waterPresetReport").dataset.resultState="none";
 $("waterPresetReport").textContent="Inputs changed. Choose Evaluate to recalculate; the live Homestead model remains unchanged.";
}
function renderNativeWaterControls(){
 const host=$("waterNativeControls");host.replaceChildren();
 const controls=waterPresetNativeControls(window.HomesteadWaterCore,$("waterPresetSelect").value);
 const intro=document.createElement("p");
 intro.textContent="Original source component inputs · independent engineering study only. Changes do not modify the connected 3D resource ledger.";
 host.append(intro);
 for(const c of controls){
  const label=document.createElement("label");label.className="waterNativeField";
  const text=document.createElement("span");text.textContent=c.name+" · "+c.label+" ("+c.unit+")";
  let input;
  if(c.kind==="boolean"){
   input=document.createElement("select");
   for(const [value,caption] of [["true","Yes"],["false","No"]]){
    const opt=document.createElement("option");opt.value=value;opt.textContent=caption;input.append(opt);
   }
   input.value=String(c.value);
  }else{
   input=document.createElement("input");input.type="number";
   input.min=String(c.min);input.max=String(c.max);input.step=String(c.step);input.value=String(c.value);
  }
  input.dataset.nativeKey=c.key;input.dataset.nativeField=c.field;input.dataset.nativeKind=c.kind;
  input.addEventListener("input",invalidateWaterStudy);
  input.addEventListener("change",invalidateWaterStudy);
  label.append(text,input);host.append(label);
 }
 if(!controls.length){const note=document.createElement("p");
  note.textContent="This original design has no supported editable parameters.";host.append(note);}
}
function readNativeWaterEdits(){
 return Array.from($("waterNativeControls").querySelectorAll("[data-native-key]")).map(input=>({
  key:input.dataset.nativeKey,field:input.dataset.nativeField,
  value:input.dataset.nativeKind==="boolean"?input.value==="true":
   input.value.trim()===""?NaN:Number(input.value)
 }));
}
$("waterPresetSelect").addEventListener("change",renderNativeWaterControls);
renderNativeWaterControls();
for(const id of ["waterPresetSelect","waterPresetScenario","waterPresetDuration"]){
 $(id).addEventListener("change",()=>{
  // Never leave a previous result visible beneath new, uncomputed inputs.
  lastWaterPreset=null;
  $("waterPresetReport").dataset.resultState="none";
  $("waterPresetReport").textContent="Inputs changed. Choose Evaluate to calculate this Water setup. Your live Homestead model is unchanged.";
 });
}
// Both source preview modes are independent of the coupled Homestead chronology.
for(const id of ["waterPresetScenario","waterPresetDuration"]){
 $(id).addEventListener("change",()=>{
  lastWaterComparison=null;
  $("waterComparisonReport").hidden=true;
  $("waterComparisonReport").replaceChildren();
 });
}
$("waterAssetReturn").addEventListener("click",()=>jumpToUtility("assetReadout"));
$("waterCompareRun").addEventListener("click",()=>{
 const host=$("waterComparisonReport");
 host.hidden=false;
 try{
  const before=JSON.stringify(activeSnapshot());
  const comparison=evaluateWaterPresetComparison(window.HomesteadWaterCore,{
   scenario:Number($("waterPresetScenario").value),
   seconds:Number($("waterPresetDuration").value)
  });
  if(JSON.stringify(activeSnapshot())!==before)
   throw new Error("Source comparison unexpectedly changed the coupled scenario");
  lastWaterComparison=comparison;
  host.replaceChildren();
  host.dataset.resultState="comparison";
  const heading=document.createElement("strong");
  heading.textContent="Eight original Water designs · "+comparison.seconds+" s · "+["low","reference","high"][comparison.scenario]+" hydraulic conditions";
  host.append(heading);
  const intro=document.createElement("p");
  intro.textContent="Each row is independently calculated by the original Water engine, not a yield estimate or potable-water ranking. Select a row to inspect its original diagnostics and treatment gaps.";
  host.append(intro);
  const scroller=document.createElement("div");
  scroller.className="nativeCompareScroll";
  const table=document.createElement("table");
  table.className="nativeCompareTable";
  const head=document.createElement("thead");
  const hr=document.createElement("tr");
  for(const label of ["Source design","Outlet (L)","Warnings","Source diagnostics"]){
   const th=document.createElement("th");th.scope="col";th.textContent=label;hr.append(th);
  }
  head.append(hr);table.append(head);
  const body=document.createElement("tbody");
  for(const result of comparison.results){
   const tr=document.createElement("tr");
   const title=document.createElement("th");title.scope="row";title.textContent=result.preset+" · "+result.name;
   const quantity=document.createElement("td");quantity.textContent=fmt(result.producedL,2);
   const warnings=document.createElement("td");warnings.textContent=String(result.warnings.length);
   const actions=document.createElement("td");
   const inspect=document.createElement("button");inspect.type="button";
   inspect.textContent="Inspect "+result.preset;
   inspect.setAttribute("aria-label","Inspect original source diagnostics for "+result.name);
   inspect.addEventListener("click",()=>{
    $("waterPresetSelect").value=result.preset;
    $("waterPresetSelect").dispatchEvent(new Event("change",{bubbles:true}));
    $("waterPresetRun").click();
    $("waterPresetReport").scrollIntoView({block:"nearest",behavior:"auto"});
    $("waterPresetReport").focus({preventScroll:true});
   });
   actions.append(inspect);tr.append(title,quantity,warnings,actions);body.append(tr);
  }
  table.append(body);scroller.append(table);host.append(scroller);
  const note=document.createElement("p");note.className="utilityResultCaution";
  note.textContent="Source analysis is a research screening only. No comparison transfers water, electricity, money, or time into the live Homestead model.";
  host.append(note);
 }catch(error){
  lastWaterComparison=null;
  host.dataset.resultState="error";
  host.textContent="Original Water design comparison failed: "+(error?.message||error);
  console.error("Water source comparison failure",error);
 }
});
$("waterTimeRun").addEventListener("click",()=>{
 const report=$("waterTimeReport");
 try{
  const before=JSON.stringify(activeSnapshot());
  const liters=Number($("waterTargetLiters").value);
  if(!$("waterTargetLiters").value.trim())throw new RangeError("Enter a target volume in liters");
  const result=evaluateWaterTimeToVolume(window.HomesteadWaterCore,{
   preset:$("waterPresetSelect").value,
   liters,scenario:Number($("waterPresetScenario").value),
   componentEdits:readNativeWaterEdits()
  });
  if(JSON.stringify(activeSnapshot())!==before)
   throw new Error("Time-to-volume study changed live Homestead state");
  report.replaceChildren();
  report.dataset.resultState=result.minutes===null?"no-flow":"flow";
  const title=document.createElement("strong");
  title.textContent=result.minutes===null?"Target not reached":fmt(result.minutes,2)+" modeled minutes";
  const details=document.createElement("p");
  details.textContent=result.minutes===null?
   "Original solver: "+result.reason:
   "Original Water source estimates "+fmt(result.liters,2)+" L at the outlet in "+fmt(result.minutes,2)+" minutes.";
  const warning=document.createElement("p");
  warning.className="utilityResultCaution";
  warning.textContent=result.assumptions;
  report.append(title,details,warning);
  report.focus({preventScroll:true});
 }catch(error){
  report.dataset.resultState="error";
  report.textContent="Time-to-volume calculation failed: "+(error?.message||error);
  console.error("Water time-to-volume failure",error);
 }
});
$("waterPresetRun").addEventListener("click",()=>{
 const report=$("waterPresetReport");
 try{
  const before=JSON.stringify(activeSnapshot());
  const result=evaluateWaterPreset(window.HomesteadWaterCore,{
   preset:$("waterPresetSelect").value,
   scenario:Number($("waterPresetScenario").value),
   seconds:Number($("waterPresetDuration").value),
   componentEdits:readNativeWaterEdits()
  });
  if(JSON.stringify(activeSnapshot())!==before)
   throw new Error("Isolated Water preview unexpectedly changed the coupled scenario");
  lastWaterPreset=result;
  report.replaceChildren();
  report.dataset.resultState=result.producedL>0?"flow":"no-flow";

  const overview=document.createElement("div");
  overview.className="utilityResultSummary";
  const eyebrow=document.createElement("small");
  eyebrow.textContent="ORIGINAL WATER SOLVER · INDEPENDENT PREVIEW";
  const amount=document.createElement("strong");
  amount.textContent=fmt(result.producedL,2)+" L";
  amount.setAttribute("aria-label","Modeled outlet quantity "+fmt(result.producedL,2)+" liters");
  const status=document.createElement("span");
  status.textContent=result.producedL>0
   ?"Modeled water reached the outlet over "+result.seconds+" seconds"
   :"No modeled water reached the outlet over "+result.seconds+" seconds";
  overview.append(eyebrow,amount,status);
  report.append(overview);

  const intro=document.createElement("p");
  intro.className="utilityInterpretation";
  intro.textContent=result.producedL>0
   ?"This is the original engine's calculated outlet quantity, not a guaranteed field yield. The live Homestead water inventory was not changed."
   :"This design yielded no outlet volume for the selected conditions. Review the source no-flow diagnostic and treatment warnings below; the live Homestead was not changed.";
  report.append(intro);

  // Selected 3D equipment drills into actual original-engine component snapshots.
  // The selected object is a role, not a fabricated one-to-one source part ID.
  const componentTypes=selectedWaterRole==="pump"?new Set(["pump_sky"]):
   selectedWaterRole==="ro"?new Set(["ro"]):
   selectedWaterRole==="treatment"?new Set(["pump_sky","ro","uf","media","mission","sawyer","bleach","boil"]):
   selectedWaterRole==="storage"?new Set(["barrel50","bucket","outlet"]):null;
  if(componentTypes){
   const matching=result.components.filter(p=>componentTypes.has(p.type));
   const heading=document.createElement("strong");
   heading.textContent="Selected 3D "+({
    pump:"pressure pump",ro:"reverse-osmosis equipment",
    treatment:"treatment equipment",storage:"storage equipment"
   }[selectedWaterRole]||"Water equipment")+" · original source components";
   report.append(heading);
   const componentList=document.createElement("dl");
   componentList.className="utilityResultsDetails";
   for(const component of matching){
    const item=document.createElement("div");
    const name=document.createElement("dt");name.textContent=component.name+" ("+component.type+")";
    const value=document.createElement("dd");
    value.textContent="Volume "+fmt(component.volumeL,2)+" L · throughput "+fmt(component.throughputL,2)+" L · flow "+fmt(component.flowLpm,2)+" L/min · source parameters "+JSON.stringify(component.params);
    item.append(name,value);componentList.append(item);
   }
   if(!matching.length){
    const note=document.createElement("p");
    note.textContent="This original preset contains no matching component for the selected equipment. Choose another source design.";
    report.append(note);
   }else report.append(componentList);
  }
  const readouts=[
   ["Source component settings",result.componentEdits.map(e=>e.key+"."+e.field+" = "+String(e.value)).join("; ")||"Original defaults"],
   ["Water source design",result.name],
   ["Hydraulic conditions",["Low","Reference","High"][result.scenario]],
   ["Elapsed source-engine time",result.seconds+" s"],
   ["Spill / drain / diversion",fmt(result.spilledL,2)+" / "+fmt(result.drainedL,2)+" / "+fmt(result.divertedL,2)+" L"],
   ["Research parts estimate",fmt(result.estimatedPartsUSD,2)+" USD (not a live price quote)"],
   ["Unpriced connections",String(result.unpricedConnections)],
   ["Source treatment screening",result.safetyScreen+" (not certification)"],
   ["Germ coverage gaps",result.treatmentGaps.join("; ")||"None flagged by this source screening"],
   ["Chemical coverage gaps",result.chemicalGaps.join("; ")||"None flagged by this source screening"],
   ["No-flow diagnostic",result.noFlowReason||"No reason reported by original source engine"]
  ];
  const details=document.createElement("dl");
  details.className="utilityResultsDetails";
  for(const [name,value] of readouts){
   const item=document.createElement("div");
   const title=document.createElement("dt");
   title.textContent=name;
   const answer=document.createElement("dd");
   answer.textContent=value;
   item.append(title,answer);
   details.append(item);
  }
  report.append(details);
  if(result.warnings.length){
   const title=document.createElement("p");
   title.className="utilityWarningTitle";
   title.textContent="Source warnings ("+result.warnings.length+")";
   report.append(title);
   const items=document.createElement("ul");
   items.className="utilityWarningList";
   for(const warning of result.warnings){
    const item=document.createElement("li");
    item.textContent=warning;
    items.append(item);
   }
   report.append(items);
  }
  const caution=document.createElement("p");
  caution.className="utilityResultCaution";
  caution.textContent="Independent source-engine calculation, NOT transferred into the live Homestead model. Not a potable-water or electrical certification.";
  report.append(caution);
 }catch(error){
  lastWaterPreset=null;
  report.dataset.resultState="error";
  report.textContent="Water source evaluation failed: "+(error?.message||error);
  console.error("Isolated Water preset failure",error);
 }
});
$("ledgerCsvBtn").addEventListener("click",()=>{
 try{
  const snapshot=activeSnapshot();
  const csv=nativeLedgerCsv(snapshot);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="homestead-resource-ledger-"+snapshot.clock.date+".csv";
  a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){fail(e)}
});
$("exportBtn").addEventListener("click",()=>{
 const payload=activeSnapshot();
 payload.visualLayout=scene?.editor?.layout()||null;
 payload.visualTime=timeline.display(payload);
 payload.exportNote="Experimental, assumption-sensitive scenario; not certified electrical or water design.";
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="homestead-scenario-"+payload.clock.date+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
try{scene=makeScene($("world"),(kind,label,options={})=>{
  // Source Water editor: picking a part opens its settings without moving camera.
  selectArea(kind,false);selectedAsset=label||null;
  $("inspectTitle").textContent=selectedAsset||descriptions[kind][0];
  $("sceneHint").textContent=selectedAsset?"Selected: "+selectedAsset:"Drag to orbit · Pinch to zoom · Select equipment";
  renderAsset(activeSnapshot());refreshObjectEditor();
  if(nativeMode){
    const picked=scene?.editor?.selected();
    if(picked?.id)nativeMode.selectSceneAsset(picked.id);
  }
  if(options.silentInspector){
   editMessage("Moved "+(label||"selected object")+" · visual layout only; native models unchanged");
   return;
  }
  const selectedWater=kind==="water"&&Boolean(label);
  selectedWaterRole=selectedWater?(
   label==="Treated-water storage tank"?"storage":
   label==="Water pressure pump"?"pump":
   label==="Reverse-osmosis treatment stage"?"ro":"treatment"):null;
  $("waterAssetReturn").hidden=!selectedWater;
  const selectedFarm=kind==="farm"&&Boolean(label);
  $("farmStudyReturn").hidden=!selectedFarm;
  const selectedBattery=kind==="energy"&&(label==="Battery storage module"||label==="Solar inverter and battery");
  $("solarBatteryReturn").hidden=!selectedBattery;
  if(selectedWater){
   if(nativeMode){
     jumpToUtility("scenarioControls");
     $("pumpPressure").focus({preventScroll:true});
     return;
   }
   // A source reference study, not an edit to the coupled equipment inventory.
   $("waterPresetSelect").value=selectedWaterRole==="storage"?"D":"E";
   $("waterPresetSelect").dispatchEvent(new Event("change",{bubbles:true}));
   jumpToUtility("waterPresetUtility");
   const field=selectedWaterRole==="storage"?"init":selectedWaterRole==="ro"?"drain":"psi";
   $("waterNativeControls").querySelector('[data-native-field="'+field+'"]')?.focus({preventScroll:true});
  }
  else if(selectedBattery){
   if(nativeMode){jumpToUtility("scenarioControls");return;}
   jumpToUtility("solarBatteryUtility");
   $("solarBatteryCurrentA").focus({preventScroll:true});
  }
  else if(selectedFarm){
   if(nativeMode){jumpToUtility("scenarioControls");return;}
   if(["Henhouse","Rabbit hutches","Pasture, hutches and livestock"].includes(selectedAsset))
     jumpToUtility("assetReadout");
   else{
     jumpToUtility("farmStudyUtility");
     $(selectedAsset?.startsWith("Rabbit")?"farmStudyDoes":"farmStudyHens").focus({preventScroll:true});
   }
  }
  else setInspectorOpen(true);
},farmVisual);selectArea("overview");redraw(activeSnapshot());
 refreshObjectEditor()}catch(e){fail(e)}
window.HomesteadApp=Object.freeze({snapshot:()=>activeSnapshot(),
 solarBattery:()=>lastSolarBatteryStudy,
 farmStudy:()=>farmStudyUI.study(),
 farmStudySource:()=>farmStudyUI.source(),
 solarAgmSweep:()=>lastSolarSweep,
 waterPreset:()=>lastWaterPreset,
 waterComparison:()=>lastWaterComparison,
 step:()=>{stop();advanceMinutes(60)},advanceMinutes:minutes=>{stop();advanceMinutes(minutes)},
 previewTime:minute=>{stop();timeline.preview(minute);updateVisibleClock()},
 resumeTime:()=>{timeline.resume();updateVisibleClock()},
 setSpeed:speed=>{timeline.setSpeed(speed);$("speedSelect").value=String(speed);updateVisibleClock()},
 time:()=>timeline.display(activeSnapshot()),
 edit:()=>scene?.editor?.status(),
 editList:()=>scene?.editor?.list(),
 editAdd:type=>scene.editor.add(type),
 editMove:(dx,dz)=>scene.editor.move(dx,dz),
  editProject:id=>scene.editor.project(id),
  editGroundScreen:(x,z)=>scene.editor.projectGround(x,z),
 editSwap:type=>scene.editor.swap(type),
 editUndo:()=>scene.editor.undo(),
 reset:()=>{stop();return resetScenario()},
 nativeReady:()=>Boolean(nativeMode),
 nativeWorld:()=>nativeMode?.controller.snapshot()??null,
 nativeLastBatch:()=>nativeMode?.controller.lastBatch()??null,
 activateNative:()=>activateOriginalNativeWorld(),
 focusHutch:()=>scene?.go("hutch"),
 focusCoopRoof:()=>scene?.go("coopRoof"),
 world:()=>({...scene?.stats(),nativeFarm:farmVisual.stats(),farmWorldOriginM})});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
