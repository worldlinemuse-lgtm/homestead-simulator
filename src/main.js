import {makeScene} from "./scene.js";
import {nativeLedgerCsv} from "./native-ledger.mjs";
import {evaluateWaterPreset,evaluateWaterPresetComparison,waterPresetNativeControls} from "./water-preset-utility.mjs";
import {UTILITY_CAPABILITIES,assertUtilityRegistry} from "./utility-registry.mjs";
import {seasonalSun} from "./seasonal-sun.mjs";
import {ScenarioTimeline,formatHour} from "./sim-clock.mjs";
const $=id=>document.getElementById(id);
const fmt=(n,d=1)=>Number(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const solarClock=h=>{const minute=Math.round(h*60);return String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0")};
const coordinator=new window.HomesteadCoordinator.Coordinator();
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
function fail(e){playing=false;scene?.setPlayback(false);$("playBtn").textContent="▶ Play";$("errors").textContent="Simulation stopped: "+(e?.message||e);$("errors").style.display="block";console.error(e);}
const descriptions={
 overview:["Whole homestead","Energy production, water treatment and animal demand connected through one chronological ledger."],
 energy:["Solar & battery","Four LONGi 435 W reference module representations. Battery dispatch is experimental, not manufacturer-calibrated."],
 water:["Water treatment","The original Water simulator's pump and reverse-osmosis hydraulic network advances treatment and storage. Electrical input is assumed."],
 farm:["Rabbit & chicken area","Rabbits, chickens and daily resource demands come from the original seeded Farm biological engine. Visual movement does not affect biology."]
};
function selectArea(kind){selected=kind in descriptions?kind:"overview";document.querySelectorAll("nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===selected));$("inspectTitle").textContent=descriptions[selected][0];$("inspectDescription").textContent=descriptions[selected][1];scene?.go(selected);}
function refreshObjectEditor(){
 if(!scene?.editor)return;
 const list=scene.editor.list(),current=scene.editor.selected();
 const sel=$("objectList"),old=sel.value;
 sel.replaceChildren();
 for(const item of list){const opt=document.createElement("option");
  opt.value=item.id;opt.textContent=item.label+(item.locked?" (garden)":" · "+item.type);
  sel.append(opt)}
 sel.value=current.id;
 $("objectRemove").disabled=current.id==="garden";
 $("objectSwap").disabled=current.id==="garden";
}
function editMessage(message,error=false){
 $("editStatus").textContent=message;$("editStatus").style.color=error?"#ffb8a5":"#bfe8ce";
}
function runEdit(operation){
 try{
  const result=operation();refreshObjectEditor();
  editMessage(result?.label?"Selected "+result.label:"Visual layout updated");
  redraw(coordinator.snapshot());
 }catch(e){editMessage(e.message,true)}
}
function renderAsset(s){
 const target=$("assetReadout");if(!target)return;
 const l=s.last,e=l?.energy,w=l?.water,d=s.farm?.daily;
 const readouts={
  "Ground-mounted solar array":[
    ["Modules","4 × 435 W (reference identity)"],
    ["PV power envelope",l?fmt(l.pv.envelopeW,0)+" W":"No interval simulated"],
    ["Modeled supplied energy",l?fmt(e.pvWh,0)+" Wh this hour":"—"],
    ["Authority","Published-reference upper bound; delivered power is assumption-adjusted"]
  ],
  "Solar inverter and battery":[
    ["Battery energy",fmt(s.batteryWh/1000,2)+" kWh"],
    ["Battery maximum",fmt(s.config.batteryCapacityWh/1000,1)+" kWh assumed"],
    ["Supply to site",l?fmt(e.servedBaseWh,1)+" Wh this hour":"—"],
    ["Authority","Experimental dispatch; not the original live Solar dispatcher"]
  ],
  "Home and utility loads":[
    ["Site background demand",fmt(s.config.backgroundLoadW,0)+" W assumed"],
    ["Demand served",l?fmt(e.servedBaseWh,1)+" Wh total":"—"],
    ["Unserved demand",l?fmt(e.unservedBaseWh,1)+" Wh":"—"]
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
    ["Original source study","Pump pressure in psi can be varied independently; no live changes"],
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
    ["Daily modeled demand",fmt(d?.waterGal||0,2)+" US gal"]
  ],
  "Henhouse":[
    ["Chickens, all ages",s.farm.animals.filter(a=>a.sp==="chicken").length],
    ["Farm electricity/day",fmt(d?.kWh||0,2)+" kWh"],
    ["Eggs in last simulated day",d?.eggs??0],
    ["Shortage effects","Not modeled biologically yet"]
  ],
  "Rabbit hutches":[
    ["Rabbits, all ages",s.farm.animals.filter(a=>a.sp==="rabbit").length],
    ["Farm demand/day",fmt(d?.waterGal||0,2)+" gal total"],
    ["Shortage effects","Not modeled biologically yet"]
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
 target.replaceChildren();
 if(!entries){const p=document.createElement("p");p.textContent="Select a building, PV array, water component, or animal area to see its model-driven connections.";target.append(p);return}
 for(const [k,v] of entries){
   const row=document.createElement("div");row.className="assetRow";
   const label=document.createElement("span");label.textContent=k;
   const val=document.createElement("strong");val.textContent=String(v);
   row.append(label,val);target.append(row);
 }
}

function redraw(s){
 farmVisual.sync(s.clock.hourOfDay);
 scene?.update({...s,farmWorld:farmVisual.world(),farmWorldOriginM});renderAsset(s);
 const e=s.last?.energy,w=s.last?.water,f=s.farm;
 $("energyValue").textContent=fmt(s.batteryWh/1000,2)+" kWh";
 $("energyDetail").textContent=e?"PV "+fmt(e.pvWh/1000,2)+" kWh/h · "+(e.pumpEnabled?"pump on":"pump off")+" · residual "+fmt(e.residualWh,4)+" Wh":"Battery remaining · awaiting interval";
 $("waterValue").textContent=fmt(s.waterStoredL,0)+" L";
 $("waterDetail").textContent=w?"Modeled treated "+fmt(w.treatedL,1)+" L/h · farm use "+fmt(w.consumedL,1)+" L":"Treated storage, not certified drinking water";
 $("farmValue").textContent=f.counts.n+" animals";
 $("farmDetail").textContent="Daily "+fmt(f.daily?.waterGal||0,1)+" gal water · "+fmt(f.daily?.kWh||0,2)+" kWh · "+(f.daily?.eggs||0)+" eggs";
 updateVisibleClock(s);
 $("alerts").textContent=s.last?.warnings.length?s.last.warnings.join(" "):"See Details for the model assumptions and limitations.";
}
function updateVisibleClock(s=coordinator.snapshot()){
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
   timeline.advance(minutes,()=>coordinator.stepHour());
   redraw(coordinator.snapshot());
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
       ()=>coordinator.stepHour());
     if(stepped)redraw(coordinator.snapshot());
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
  scene?.editor?.reset();
  refreshObjectEditor();
  const next=coordinator.reset();
  timeline.reset();
  farmVisual.init(20261104,next.clock.hourOfDay);
  redraw(next);
  return next;
}
$("resetBtn").addEventListener("click",()=>{stop();try{resetScenario();$("errors").style.display="none"}catch(e){fail(e)}});
document.querySelectorAll("nav [data-view]").forEach(b=>b.addEventListener("click",()=>{selectedAsset=null;selectArea(b.dataset.view);$("sceneHint").textContent=selected==="farm"
  ?"Tap an animal to follow · Drag to orbit · Pinch to zoom"
  :"Drag to orbit · Pinch to zoom · Select equipment";renderAsset(coordinator.snapshot())}));
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
$("utilitiesBtn").addEventListener("click",()=>jumpToUtility("utilityHub"));
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
$("editMode").addEventListener("change",()=>{
 scene?.editor?.setEditMode($("editMode").checked);
 editMessage($("editMode").checked?"Drag a selected visual object on the terrain":"Drag mode off");
});
$("objectList").addEventListener("change",()=>runEdit(()=>scene.editor.select($("objectList").value)));
$("objectAdd").addEventListener("click",()=>runEdit(()=>scene.editor.add($("objectType").value)));
$("objectSwap").addEventListener("click",()=>runEdit(()=>scene.editor.swap($("objectType").value)));
$("objectRemove").addEventListener("click",()=>runEdit(()=>scene.editor.remove()));
$("objectUndo").addEventListener("click",()=>runEdit(()=>scene.editor.undo()));
for(const [id,dx,dz] of [["objectLeft",-1,0],["objectRight",1,0],
 ["objectUp",0,-1],["objectDown",0,1]]){
 $(id).addEventListener("click",()=>runEdit(()=>scene.editor.move(dx,dz)));
}
$("objectRotate").addEventListener("click",()=>runEdit(()=>scene.editor.rotate(Math.PI/2)));
for(const [id,out,key,fn] of [["cloud","cloudOut","cloudTransmittance",x=>fmt(x*100,0)+"%"],["houseLoad","houseLoadOut","backgroundLoadW",x=>fmt(x,0)+" W"],["pumpLoad","pumpLoadOut","pumpElectricalW",x=>fmt(x,0)+" W"]]){
 $(id).addEventListener("input",()=>{const raw=Number($(id).value),v=id==="cloud"?raw/100:raw;$(out).textContent=fn(v);try{redraw(coordinator.configure({[key]:v}))}catch(e){fail(e)}})
}
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
  const before=JSON.stringify(coordinator.snapshot());
  const comparison=evaluateWaterPresetComparison(window.HomesteadWaterCore,{
   scenario:Number($("waterPresetScenario").value),
   seconds:Number($("waterPresetDuration").value)
  });
  if(JSON.stringify(coordinator.snapshot())!==before)
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
$("waterPresetRun").addEventListener("click",()=>{
 const report=$("waterPresetReport");
 try{
  const before=JSON.stringify(coordinator.snapshot());
  const result=evaluateWaterPreset(window.HomesteadWaterCore,{
   preset:$("waterPresetSelect").value,
   scenario:Number($("waterPresetScenario").value),
   seconds:Number($("waterPresetDuration").value),
   componentEdits:readNativeWaterEdits()
  });
  if(JSON.stringify(coordinator.snapshot())!==before)
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
  const snapshot=coordinator.snapshot();
  const csv=nativeLedgerCsv(snapshot);
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="homestead-resource-ledger-"+snapshot.clock.date+".csv";
  a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){fail(e)}
});
$("exportBtn").addEventListener("click",()=>{
 const payload=coordinator.snapshot();
 payload.visualLayout=scene?.editor?.layout()||null;
 payload.visualTime=timeline.display(payload);
 payload.exportNote="Experimental, assumption-sensitive scenario; not certified electrical or water design.";
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="homestead-scenario-"+payload.clock.date+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
try{scene=makeScene($("world"),(kind,label)=>{
  selectArea(kind);selectedAsset=label||null;
  $("inspectTitle").textContent=selectedAsset||descriptions[kind][0];
  $("sceneHint").textContent=selectedAsset?"Selected: "+selectedAsset:"Drag to orbit · Pinch to zoom · Select equipment";
  renderAsset(coordinator.snapshot());refreshObjectEditor();
  const selectedWater=kind==="water"&&Boolean(label);
  selectedWaterRole=selectedWater?(
   label==="Treated-water storage tank"?"storage":
   label==="Water pressure pump"?"pump":
   label==="Reverse-osmosis treatment stage"?"ro":"treatment"):null;
  $("waterAssetReturn").hidden=!selectedWater;
  if(selectedWater){
   // A source reference study, not an edit to the coupled equipment inventory.
   $("waterPresetSelect").value=selectedWaterRole==="storage"?"D":"E";
   $("waterPresetSelect").dispatchEvent(new Event("change",{bubbles:true}));
   jumpToUtility("waterPresetUtility");
   const field=selectedWaterRole==="storage"?"init":selectedWaterRole==="ro"?"drain":"psi";
   $("waterNativeControls").querySelector('[data-native-field="'+field+'"]')?.focus({preventScroll:true});
  }
  else setInspectorOpen(true);
},farmVisual);selectArea("overview");redraw(coordinator.snapshot());
 refreshObjectEditor()}catch(e){fail(e)}
window.HomesteadApp=Object.freeze({snapshot:()=>coordinator.snapshot(),
 waterPreset:()=>lastWaterPreset,
 waterComparison:()=>lastWaterComparison,
 step:()=>{stop();advanceMinutes(60)},advanceMinutes:minutes=>{stop();advanceMinutes(minutes)},
 previewTime:minute=>{stop();timeline.preview(minute);updateVisibleClock()},
 resumeTime:()=>{timeline.resume();updateVisibleClock()},
 setSpeed:speed=>{timeline.setSpeed(speed);$("speedSelect").value=String(speed);updateVisibleClock()},
 time:()=>timeline.display(coordinator.snapshot()),
 edit:()=>scene?.editor?.status(),
 editList:()=>scene?.editor?.list(),
 editAdd:type=>scene.editor.add(type),
 editMove:(dx,dz)=>scene.editor.move(dx,dz),
 editSwap:type=>scene.editor.swap(type),
 editUndo:()=>scene.editor.undo(),
 reset:()=>{stop();return resetScenario()},
 focusHutch:()=>scene?.go("hutch"),
 focusCoopRoof:()=>scene?.go("coopRoof"),
 world:()=>({...scene?.stats(),nativeFarm:farmVisual.stats(),farmWorldOriginM})});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
