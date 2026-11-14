// Independent secondary test: execute the actual UI picker and return handlers
// extracted from this exact revision. No duplicate model or PRIMARY source edits.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source=fs.readFileSync(new URL("../src/main.js",import.meta.url),"utf8");

function between(start,end){
 const i=source.indexOf(start);assert.ok(i>=0,"Missing source handler: "+start);
 const j=source.indexOf(end,i+start.length);
 assert.ok(j>i,"Missing end of source handler: "+end);
 return source.slice(i+start.length,j);
}
const picker=between('try{scene=makeScene($("world"),(kind,label)=>{',
 '},farmVisual);selectArea("overview");redraw(coordinator.snapshot());');
const jump=between('function jumpToUtility(sectionId){',
 'function renderUtilityDirectory(search=""){');
function harness(){
 const elements={};let focused=null,route=null,reads=0;
 for(const id of ["inspectTitle","inspectDescription","sceneHint",
  "solarBatteryReturn","farmStudyReturn","waterAssetReturn","waterPresetSelect"]){
  elements[id]={textContent:"",hidden:true,value:"",dispatchEvent:()=>{}};
 }
 for(const id of ["solarBatteryCurrentA","farmStudyDoes","farmStudyHens"])
  elements[id]={focus:()=>{focused=id}};
 elements.waterNativeControls={querySelector:()=>({focus:()=>{focused="waterNativeControls"}})};
 const section=(id,heading)=>({
  getAttribute:k=>k==="aria-labelledby"?heading:null,
  querySelector:()=>({textContent:"Independent native source study"}),
  scrollIntoView:()=>{route=id},
  focus:()=>{focused=id}
 });
 elements.solarBatteryHeading={textContent:"Original Solar battery engineering study"};
 elements.farmStudyHeading={textContent:"Original Farm biological scenario study"};
 elements.waterPresetHeading={textContent:"Original Water source study"};
 elements.solarBatteryUtility=section("solarBatteryUtility","solarBatteryHeading");
 elements.farmStudyUtility=section("farmStudyUtility","farmStudyHeading");
 elements.waterPresetUtility=section("waterPresetUtility","waterPresetHeading");
 elements.assetReadout=section("assetReadout",null);
 const immutable=Object.freeze({model:"live",day:0});
 const ctx=vm.createContext({
  elements,Event:class {constructor(type,options){this.type=type;this.options=options}},
  coordinator:{snapshot:()=>{reads++;return immutable}}
 });
 const program=[
  "let selected='overview',selectedAsset=null,selectedWaterRole=null;",
  "const descriptions={overview:['Whole homestead','Overview'],energy:['Solar & battery','Solar scope'],water:['Water treatment','Water scope'],farm:['Rabbit & chicken area','Farm scope']};",
  "const $=id=>elements[id];",
  "function selectArea(kind){selected=kind;}",
  "function setInspectorOpen(open){}",
  "function renderAsset(){}",
  "function refreshObjectEditor(){}",
  "function jumpToUtility(sectionId){"+jump,
  "const onPick=(kind,label)=>{"+picker+"};",
  "const state=()=>({selectedAsset,selectedWaterRole,selected,title:$(\"inspectTitle\").textContent,batteryReturnVisible:!$(\"solarBatteryReturn\").hidden,farmReturnVisible:!$(\"farmStudyReturn\").hidden,waterReturnVisible:!$(\"waterAssetReturn\").hidden});"
 ].join("\n");
 vm.runInContext(program,ctx,{timeout:1500});
 const exec=js=>vm.runInContext(js,ctx,{timeout:1500});
 return {
  pick:(kind,label)=>exec("onPick("+JSON.stringify(kind)+","+JSON.stringify(label)+")"),
  ret:()=>exec('jumpToUtility("assetReadout")'),
  state:()=>structuredClone(exec("state()")),
  focus:()=>focused,
  route:()=>route,
  reads:()=>reads
 };
}
test("3D battery selection and study return restore the selected battery, never an earlier barn",()=>{
 const ui=harness();
 ui.pick("energy","Battery storage module");
 assert.equal(ui.state().selectedAsset,"Battery storage module");
 assert.equal(ui.state().title,"Original Solar battery engineering study");
 assert.equal(ui.state().batteryReturnVisible,true);
 assert.equal(ui.focus(),"solarBatteryCurrentA");
 ui.ret();
 assert.equal(ui.state().title,"Battery storage module");
 assert.notEqual(ui.state().title,"Feed and equipment storage barn");
 assert.equal(ui.focus(),"assetReadout");
 assert.equal(ui.route(),"assetReadout");
 assert.equal(ui.reads(),1,"only the selected asset readout may read live state");
});
test("3D Water pump selection restores pump identity and source-specific pressure focus",()=>{
 const ui=harness();
 ui.pick("water","Water pressure pump");
 assert.equal(ui.state().selectedWaterRole,"pump");
 assert.equal(ui.state().waterReturnVisible,true);
 assert.equal(ui.focus(),"waterNativeControls");
 ui.ret();
 assert.equal(ui.state().title,"Water pressure pump");
});
test("3D Farm rabbit selection restores its identity after native Farm study",()=>{
 const ui=harness();
 ui.pick("farm","Rabbit #12");
 assert.equal(ui.state().selectedAsset,"Rabbit #12");
 assert.equal(ui.state().title,"Original Farm biological scenario study");
 assert.equal(ui.state().farmReturnVisible,true);
 assert.equal(ui.focus(),"farmStudyDoes");
 ui.ret();
 assert.equal(ui.state().title,"Rabbit #12");
 assert.equal(ui.focus(),"assetReadout");
});
