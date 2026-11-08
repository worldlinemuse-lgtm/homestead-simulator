import {makeScene} from "./scene.js";
const $=id=>document.getElementById(id);
const fmt=(n,d=1)=>Number(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const coordinator=new window.HomesteadCoordinator.Coordinator();
let selected="overview",playing=false,timer=null,scene;
function fail(e){playing=false;clearInterval(timer);timer=null;$("playBtn").textContent="▶ Play";$("errors").textContent="Simulation stopped: "+(e?.message||e);$("errors").style.display="block";console.error(e);}
const descriptions={
 overview:["Whole homestead","Energy production, water treatment and animal demand connected through one chronological ledger."],
 energy:["Solar & battery","Four LONGi 435 W reference module representations. Battery dispatch is experimental, not manufacturer-calibrated."],
 water:["Water treatment","The original Water simulator's pump and reverse-osmosis hydraulic network advances treatment and storage. Electrical input is assumed."],
 farm:["Rabbit & chicken area","Rabbits, chickens and daily resource demands come from the original seeded Farm biological engine. Visual movement does not affect biology."]
};
function selectArea(kind){selected=kind in descriptions?kind:"overview";document.querySelectorAll("nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===selected));$("inspectTitle").textContent=descriptions[selected][0];$("inspectDescription").textContent=descriptions[selected][1];scene?.go(selected);}
function redraw(s){
 scene?.update(s);
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
document.querySelectorAll("nav [data-view]").forEach(b=>b.addEventListener("click",()=>selectArea(b.dataset.view)));
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
try{scene=makeScene($("world"),kind=>{selectArea(kind);$("inspector").classList.add("open")});selectArea("overview");redraw(coordinator.snapshot())}catch(e){fail(e)}
window.HomesteadApp=Object.freeze({snapshot:()=>coordinator.snapshot(),step:tick,reset:()=>redraw(coordinator.reset())});
