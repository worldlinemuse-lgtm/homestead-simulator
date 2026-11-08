import {makeScene} from "./scene.js";
const $=id=>document.getElementById(id);
const fmt=(n,d=1)=>Number(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const coordinator=new window.HomesteadCoordinator.Coordinator();
let selected="overview",playing=false,timer=null,scene;
let selectedAsset=null;
function fail(e){playing=false;clearInterval(timer);timer=null;$("playBtn").textContent="▶ Play";$("errors").textContent="Simulation stopped: "+(e?.message||e);$("errors").style.display="block";console.error(e);}
const descriptions={
 overview:["Whole homestead","Energy production, water treatment and animal demand connected through one chronological ledger."],
 energy:["Solar & battery","Four LONGi 435 W reference module representations. Battery dispatch is experimental, not manufacturer-calibrated."],
 water:["Water treatment","The original Water simulator's pump and reverse-osmosis hydraulic network advances treatment and storage. Electrical input is assumed."],
 farm:["Rabbit & chicken area","Rabbits, chickens and daily resource demands come from the original seeded Farm biological engine. Visual movement does not affect biology."]
};
function selectArea(kind){selected=kind in descriptions?kind:"overview";document.querySelectorAll("nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===selected));$("inspectTitle").textContent=descriptions[selected][0];$("inspectDescription").textContent=descriptions[selected][1];scene?.go(selected);}
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
 const animalMatch=/^(Rabbit|Chicken) #(\d+)$/.exec(selectedAsset||"");
 if(animalMatch){
   const id=Number(animalMatch[2]);
   const a=(s.farm.animals||[]).find(x=>Number(x.id)===id);
   if(a)entries=[
     ["Model animal ID",a.id],["Species",a.sp],
     ["Life stage",a.st],["Modeled health",Number.isFinite(a.health)?fmt(a.health,1):"Unavailable"],
     ["Authority","Original Farm daily biological engine; display movement is illustrative"]
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
 scene?.update(s);renderAsset(s);
 const e=s.last?.energy,w=s.last?.water,f=s.farm;
 $("energyValue").textContent=fmt(s.batteryWh/1000,2)+" kWh";
 $("energyDetail").textContent=e?"PV "+fmt(e.pvWh/1000,2)+" kWh/h · "+(e.pumpEnabled?"pump on":"pump off")+" · residual "+fmt(e.residualWh,4)+" Wh":"Battery remaining · awaiting interval";
 $("waterValue").textContent=fmt(s.waterStoredL,0)+" L";
 $("waterDetail").textContent=w?"Modeled treated "+fmt(w.treatedL,1)+" L/h · farm use "+fmt(w.consumedL,1)+" L":"Treated storage, not certified drinking water";
 $("farmValue").textContent=f.counts.n+" animals";
 $("farmDetail").textContent="Daily "+fmt(f.daily?.waterGal||0,1)+" gal water · "+fmt(f.daily?.kWh||0,2)+" kWh · "+(f.daily?.eggs||0)+" eggs";
 $("simDate").textContent=s.clock.date+" · "+String(s.clock.hourOfDay).padStart(2,"0")+":00";
 $("simPhase").textContent="Model hour "+s.clock.hours+" · linked resource accounting";
 $("alerts").textContent=s.last?.warnings.length?s.last.warnings.join(" "):"See Details for the model assumptions and limitations.";
}
function tick(){try{$("errors").style.display="none";redraw(coordinator.stepHour())}catch(e){fail(e)}}
function stop(){playing=false;clearInterval(timer);timer=null;$("playBtn").textContent="▶ Play"}
function toggle(){if(playing){stop();return;}playing=true;$("playBtn").textContent="Ⅱ Pause";timer=setInterval(tick,1200);tick()}
$("playBtn").addEventListener("click",toggle);$("stepBtn").addEventListener("click",()=>{stop();tick()});
$("dayBtn").addEventListener("click",()=>{stop();try{for(let i=0;i<24;i++)coordinator.stepHour();redraw(coordinator.snapshot())}catch(e){fail(e)}});
$("resetBtn").addEventListener("click",()=>{stop();try{redraw(coordinator.reset());$("errors").style.display="none"}catch(e){fail(e)}});
document.querySelectorAll("nav [data-view]").forEach(b=>b.addEventListener("click",()=>{selectedAsset=null;selectArea(b.dataset.view);$("sceneHint").textContent="Drag to orbit · Pinch to zoom · Select equipment";renderAsset(coordinator.snapshot())}));
$("inspectBtn").addEventListener("click",()=>$("inspector").classList.toggle("open"));
$("closeInspector").addEventListener("click",()=>$("inspector").classList.remove("open"));
for(const [id,out,key,fn] of [["cloud","cloudOut","cloudTransmittance",x=>fmt(x*100,0)+"%"],["houseLoad","houseLoadOut","backgroundLoadW",x=>fmt(x,0)+" W"],["pumpLoad","pumpLoadOut","pumpElectricalW",x=>fmt(x,0)+" W"]]){
 $(id).addEventListener("input",()=>{const raw=Number($(id).value),v=id==="cloud"?raw/100:raw;$(out).textContent=fn(v);try{redraw(coordinator.configure({[key]:v}))}catch(e){fail(e)}})
}
$("exportBtn").addEventListener("click",()=>{
 const payload=coordinator.snapshot();payload.exportNote="Experimental, assumption-sensitive scenario; not certified electrical or water design.";
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="homestead-scenario-"+payload.clock.date+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
try{scene=makeScene($("world"),(kind,label)=>{
  selectArea(kind);selectedAsset=label||null;
  $("inspectTitle").textContent=selectedAsset||descriptions[kind][0];
  $("sceneHint").textContent=selectedAsset?"Selected: "+selectedAsset:"Drag to orbit · Pinch to zoom · Select equipment";
  renderAsset(coordinator.snapshot());$("inspector").classList.add("open");
});selectArea("overview");redraw(coordinator.snapshot())}catch(e){fail(e)}
window.HomesteadApp=Object.freeze({snapshot:()=>coordinator.snapshot(),step:tick,reset:()=>redraw(coordinator.reset()),world:()=>scene?.stats()});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
