import {runNativeFarmDailyStudy,FARM_STUDY_SOURCE} from "./farm-native-study.mjs";
// Real UI over the original seeded Farm daily engine, isolated from Homestead.
export function installFarmNativeStudy({$,coordinator,stop,jumpToUtility,focusFarm,fmt}){
 let result=null,generation=0;
 const inputFields=[
  ["farmStudyDoes","mg_does"],["farmStudyHens","mg_hens"],
  ["farmStudyRoosters","mg_roosters"],["farmStudySet","mg_set"]
 ];
 const ids=["farmStudyDays","farmStudySeed",...inputFields.map(([id])=>id)];
 function invalidate(){
  generation++;result=null;
  $("farmStudyRun").disabled=false;$("farmStudyCsv").disabled=true;
  $("farmStudyReport").dataset.resultState="none";
  $("farmStudyReport").textContent=
   "Farm inputs changed. Run the original source biology again. Live Homestead state remains unchanged.";
 }
 for(const id of ids){
  $(id).addEventListener("input",invalidate);
  $(id).addEventListener("change",invalidate);
 }
 const add=(parent,tag,text,cls)=>{
  const node=document.createElement(tag);node.textContent=String(text);
  if(cls)node.className=cls;
  parent.append(node);return node;
 };
 function render(study){
  const host=$("farmStudyReport");host.replaceChildren();
  host.dataset.resultState="complete";
  add(host,"h4","Original Farm · "+study.days+" biological days · seed "+study.seed);
  add(host,"p","Original source "+study.source.path+" @ "+study.source.revision.slice(0,8)+
   " · "+study.initial.date+" to "+study.final.date);
  const summary=document.createElement("dl");
  summary.className="utilityResultsDetails";host.append(summary);
  for(const [label,value] of [
   ["Final modeled animals",fmt(study.final.animals,0)+" animals"],
   ["Modeled eggs",fmt(study.totals.eggs,0)+" eggs"],
   ["Original Farm water demand",fmt(study.totals.waterGal,2)+" US gal"],
   ["Original Farm electricity demand",fmt(study.totals.electricityKWh,3)+" kWh"],
   ["Live scenario","Unchanged (separate source worker)"]
  ]){add(summary,"dt",label);add(summary,"dd",value);}
  const svgNs="http://www.w3.org/2000/svg",svg=document.createElementNS(svgNs,"svg");
  svg.setAttribute("viewBox","0 0 350 165");svg.setAttribute("role","img");
  svg.setAttribute("class","solarSourceChart");
  svg.setAttribute("aria-label","Source Farm animal counts, one value per biological day");
  const vals=[study.initial,...study.series],max=Math.max(1,...vals.map(x=>x.animals));
  const poly=document.createElementNS(svgNs,"polyline");
  poly.setAttribute("fill","none");poly.setAttribute("stroke","#b4e9cc");
  poly.setAttribute("stroke-width","2.5");
  poly.setAttribute("points",vals.map((x,i)=>
   (25+300*i/study.days)+","+(135-105*x.animals/max)).join(" "));
  svg.append(poly);
  const caption=document.createElementNS(svgNs,"text");
  caption.setAttribute("x","175");caption.setAttribute("y","158");
  caption.setAttribute("fill","#d7e5ea");caption.setAttribute("font-size","12");
  caption.setAttribute("text-anchor","middle");
  caption.textContent="Biological day →";svg.append(caption);host.append(svg);
  const table=document.createElement("table");table.className="solarSourceTable";
  const head=table.createTHead(),tr=head.insertRow();
  for(const title of ["Day","Animals","Eggs","Water (US gal)","Electricity (kWh)"])
   add(tr,"th",title);
  const body=table.createTBody();
  for(let i=0;i<study.series.length;i++){
   if(study.days>30&&i!==0&&i!==study.series.length-1&&(i+1)%7!==0)continue;
   const d=study.series[i],line=body.insertRow();
   for(const val of [d.day,fmt(d.animals,0),fmt(d.eggs,0),
    fmt(d.waterGal,2),fmt(d.electricityKWh,3)])add(line,"td",val);
  }
  host.append(table);
  add(host,"p",study.days>30?
   "Weekly checkpoints shown; export all daily measurements in CSV.":
   "All native daily measurements shown and available as CSV.","utilityHelp");
  for(const warning of study.limitations)add(host,"p",warning,"utilityResultCaution");
  $("farmStudyCsv").disabled=false;
 }
 $("farmStudyRun").addEventListener("click",async()=>{
  const host=$("farmStudyReport"),button=$("farmStudyRun"),id=++generation;
  stop();const before=JSON.stringify(coordinator.snapshot());
  result=null;$("farmStudyCsv").disabled=true;button.disabled=true;
  host.dataset.resultState="running";
  host.textContent="Running original Farm biology in an isolated worker. No live resources are transferred.";
  const num=name=>{const raw=$(name).value.trim();return raw===""?NaN:Number(raw)};
  try{
   const study=await runNativeFarmDailyStudy({
    days:num("farmStudyDays"),seed:num("farmStudySeed"),
    parameters:Object.fromEntries(inputFields.map(([element,key])=>[key,num(element)]))
   });
   if(id!==generation)return;
   if(JSON.stringify(coordinator.snapshot())!==before)
    throw new Error("Native Farm study unexpectedly changed connected Homestead state");
   result=study;render(study);host.focus({preventScroll:true});
  }catch(error){
   if(id!==generation)return;
   host.dataset.resultState="error";
   host.textContent="Original Farm study failed: "+String(error?.message||error);
   result=null;$("farmStudyCsv").disabled=true;
  }finally{if(id===generation)button.disabled=false;}
 });
 $("farmStudyCsv").addEventListener("click",()=>{
  if(!result)return;
  const lines=[
   ["day","date","animals_count","eggs_count","water_US_gal","electricity_kWh"],
   ...result.series.map(d=>[d.day,d.date,d.animals,d.eggs,d.waterGal,d.electricityKWh])
  ];
  const csv=lines.map(row=>row.join(",")).join("\r\n")+"\r\n";
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="farm-original-native-daily-seed-"+result.seed+".csv";
  link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 $("farmStudyReturn").addEventListener("click",()=>jumpToUtility("assetReadout"));
 return Object.freeze({study:()=>result,source:()=>FARM_STUDY_SOURCE});
}