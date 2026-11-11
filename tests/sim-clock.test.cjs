"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
test("minute ticks remain minute precise, advancing science only on hour boundaries",async()=>{
 const {ScenarioTimeline,formatHour}=await import("../src/sim-clock.mjs");
 const t=new ScenarioTimeline(5),model={clock:{hourOfDay:9,date:"2026-11-11"}};
 let steps=0;
 const step=()=>{steps++;model.clock.hourOfDay=(model.clock.hourOfDay+1)%24};
 assert.equal(t.advance(59,step),0);assert.equal(steps,0);
 assert.equal(formatHour(t.display(model).hour),"09:59");
 assert.equal(t.advance(1,step),1);assert.equal(steps,1);
 assert.equal(formatHour(t.display(model).hour),"10:00");
 t.advance(1,step);assert.equal(formatHour(t.display(model).hour),"10:01");
 t.advance(15,step);assert.equal(formatHour(t.display(model).hour),"10:16");
 t.advance(24*60-16,step);assert.equal(steps,25);
 assert.equal(formatHour(t.display(model).hour),"10:00");
});
test("lighting preview can seek backwards without rolling back model or resources",async()=>{
 const {ScenarioTimeline}=await import("../src/sim-clock.mjs");
 const t=new ScenarioTimeline(),s={clock:{hourOfDay:9,date:"2026-11-11"}};
 t.preview(1325);
 assert.equal(t.display(s).preview,true);
 assert.equal(t.display(s).hour,1325/60);
 assert.equal(t.display(s).modelHour,9);
 assert.equal(s.clock.hourOfDay,9);
 t.resume();assert.equal(t.display(s).hour,9);
 for(const invalid of [-1,1440,1.1,NaN])assert.throws(()=>t.preview(invalid),RangeError);
});
test("speed presets and background frame cap prevent unstable multi-hour steps",async()=>{
 const {ScenarioTimeline,SPEEDS}=await import("../src/sim-clock.mjs");
 assert.deepEqual([...SPEEDS],[.25,1,5,15,60,120]);
 const t=new ScenarioTimeline();assert.throws(()=>t.setSpeed(NaN));
 t.setSpeed(120);let n=0;
 const step=()=>n++;
 t.advanceRealSeconds(1000,step);assert.equal(n,0);
 assert.equal(t.fractionMinutes,30);
 t.advanceRealSeconds(.25,step);assert.equal(n,1);
 t.reset();assert.equal(t.fractionMinutes,0);
 assert.throws(()=>t.advance(-1,step));
});
test("failed hour step never commits a new fractional minute",async()=>{
 const {ScenarioTimeline}=await import("../src/sim-clock.mjs");
 const t=new ScenarioTimeline();
 t.advance(30,()=>{});
 assert.throws(()=>t.advance(40,()=>{throw Error("source failure")}),/source failure/);
 assert.equal(t.fractionMinutes,30);
});
