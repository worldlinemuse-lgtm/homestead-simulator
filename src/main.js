import {makeScene} from "./scene.js";
import {nativeLedgerCsv} from "./native-ledger.mjs";
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
$("inspectBtn").addEventListener("click",()=>$("inspector").classList.toggle("open"));
$("hudToggle").addEventListener("click",()=>{const collapsed=$("summary").classList.toggle("collapsed");$("hudToggle").setAttribute("aria-expanded",String(!collapsed));$("hudToggle").setAttribute("aria-label",collapsed?"Expand resource summary":"Collapse resource summary");});
// Keep the living landscape visible on narrow phones; all readings remain one tap away.
if(window.matchMedia("(max-width: 650px)").matches){
 $("summary").classList.add("collapsed");
 $("hudToggle").setAttribute("aria-expanded","false");
 $("hudToggle").setAttribute("aria-label","Expand resource summary");
}
$("closeInspector").addEventListener("click",()=>$("inspector").classList.remove("open"));
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
  $("inspector").classList.add("open");
},farmVisual);selectArea("overview");redraw(coordinator.snapshot());
 refreshObjectEditor()}catch(e){fail(e)}
window.HomesteadApp=Object.freeze({snapshot:()=>coordinator.snapshot(),
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
