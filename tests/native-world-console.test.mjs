import test from "node:test";
import assert from "node:assert/strict";
import {mountNativeWorldConsole} from "../src/native-world-console.mjs";
import {createOriginalNativeController} from "../src/native-coupled-runtime.mjs";

class Element {
  constructor(doc,tag){this.ownerDocument=doc;this.tagName=tag;this.children=[];this.handlers=new Map();this.textContent="";this.disabled=false;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];}
  remove(){this.removed=true;}
  setAttribute(key,value){this[key]=value;}
  addEventListener(name,fn){this.handlers.set(name,fn);}
  removeEventListener(name){this.handlers.delete(name);}
  click(){this.handlers.get("click")?.();}
}
const document={createElement(tag){return new Element(document,tag);}};
const state={clockMinute:0,storedWaterL:4,waterCapacityL:10,solar:{},water:{},farm:{}};
const advanceHour=({clockMinute,state})=>({
  state:{...state,clockMinute:clockMinute+60},
  ledger:Array.from({length:60},(_,i)=>({
    minute:clockMinute+i,requestedWh:0,deliveredWh:0,
    baseServedWh:0,waterServedWh:0,farmServedWh:0,
    waterDeliveredL:0,waterConsumedL:0,waterOverflowL:0
  })),
  totals:{energyRequestedWh:0,energyDeliveredWh:0,waterProducedL:0,waterConsumedL:0},
  waterOverflowL:0
});
test("scene and Utilities share real controller revisions and clock",()=>{
  const controller=createOriginalNativeController({initialState:state,advanceHour});
  const observed=[];
  const scene={renderNativeWorld(s,r){observed.push([s.clockMinute,r]);}};
  const root=new Element(document,"main");
  const ui=mountNativeWorldConsole({controller,scene,root});
  assert.deepEqual(observed,[[0,0]]);
  assert.equal(ui.clockMinute,0);
  const section=root.children[0];
  const button=section.children[2];
  button.click();
  assert.equal(controller.snapshot().clockMinute,60);
  assert.equal(ui.clockMinute,60);
  assert.deepEqual(observed.at(-1),[60,1]);
  ui.editAsset("tank",draft=>{draft.storedWaterL=7;});
  assert.equal(ui.snapshot().storedWaterL,7);
  assert.deepEqual(observed.at(-1),[60,2]);
  ui.dispose();
  assert.equal(section.removed,true);
  assert.equal(button.handlers.size,0);
});
test("invalid native advance reports error and does not mutate state",()=>{
  const controller=createOriginalNativeController({
    initialState:state,advanceHour(){throw Error("source solver failed");}
  });
  const errors=[];
  const root=new Element(document,"main");
  const ui=mountNativeWorldConsole({
    controller,scene:{renderNativeWorld(){}},root,onError:e=>errors.push(e.message)
  });
  root.children[0].children[2].click();
  assert.deepEqual(errors,["source solver failed"]);
  assert.equal(controller.snapshot().clockMinute,0);
  assert.equal(controller.revision,0);
  ui.dispose();
});

test("24-hour native advance uses the same controller and displays actual ledger totals",()=>{
  const controller=createOriginalNativeController({initialState:state,advanceHour});
  const root=new Element(document,"main");
  const sceneRevisions=[];
  const ui=mountNativeWorldConsole({controller,root,
    scene:{renderNativeWorld(s,r){sceneRevisions.push([s.clockMinute,r]);}}});
  const section=root.children[0];
  const dayButton=section.children[3];
  dayButton.click();
  assert.equal(controller.snapshot().clockMinute,1440);
  assert.equal(ui.clockMinute,1440);
  assert.deepEqual(sceneRevisions.at(-1),[1440,1]);
  assert.match(section.children[4].textContent,/Last 24 h/);
  assert.match(section.children[4].textContent,/electricity 0.00 Wh/);
  assert.match(section.children[4].textContent,/water 0.00 L produced/);
  assert.equal(dayButton.disabled,false);
  ui.dispose();
  assert.equal(dayButton.handlers.size,0);
});
test("failed 24-hour advance does not publish metering or partial state",()=>{
  const controller=createOriginalNativeController({initialState:state,
    advanceHour({clockMinute,state}){
      if(clockMinute===120)throw Error("native water solver failed");
      return advanceHour({clockMinute,state});
    }});
  const errors=[],root=new Element(document,"main");
  const ui=mountNativeWorldConsole({controller,root,
    scene:{renderNativeWorld(){}},onError:e=>errors.push(e.message)});
  const section=root.children[0];
  section.children[3].click();
  assert.deepEqual(errors,["native water solver failed"]);
  assert.equal(controller.snapshot().clockMinute,0);
  assert.equal(controller.revision,0);
  assert.equal(section.children[4].textContent,"");
  ui.dispose();
});

test("native console reports measured nonzero resource totals without inventing values",()=>{
  const measured=({clockMinute,state})=>({
    state:{...state,clockMinute:clockMinute+60,storedWaterL:state.storedWaterL+1},
    ledger:Array.from({length:60},(_,i)=>({
      minute:clockMinute+i,requestedWh:2,deliveredWh:1,
      baseServedWh:0.5,waterServedWh:0.25,farmServedWh:0.25,
      waterDeliveredL:0.05,waterConsumedL:2/60,waterOverflowL:0
    })),
    totals:{energyRequestedWh:120,energyDeliveredWh:60,waterProducedL:3,waterConsumedL:2},
    waterOverflowL:0
  });
  const controller=createOriginalNativeController({initialState:state,advanceHour:measured});
  const root=new Element(document,"main");
  const ui=mountNativeWorldConsole({controller,root,scene:{renderNativeWorld(){}}});
  root.children[0].children[3].click();
  const display=root.children[0].children[4].textContent;
  assert.match(display,/Last 24 h/);
  assert.match(display,/1440.00 Wh delivered \/ 2880.00 Wh requested/);
  assert.match(display,/72.00 L produced, 48.00 L consumed/);
  assert.match(display,/28.00 L stored/);
  assert.equal(controller.snapshot().clockMinute,1440);
  ui.dispose();
});
