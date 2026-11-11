"use strict";
const test=require("node:test"),assert=require("node:assert/strict");

test("native chicken coop and run share an actual east doorway, not an oversized building",async()=>{
  const {nativeCoopRunPortal}=await import("../src/plot-layout.mjs");
  // Original Farm preset in vendor/farm-core.js; original coordinates are feet.
  const source=[{id:"coop",type:"coop",x:40,y:10,w:8,d:8},
    {id:"run",type:"run",x:48,y:10,w:12,d:14}];
  const p=nativeCoopRunPortal(source,{x:23,y:0,z:6});
  assert.ok(p,"attached Farm coop/run must expose a portal");
  assert.equal(p.axis,"x");
  assert.ok(Math.abs(p.plane-(23+48*.3048))<1e-10);
  assert.ok(Math.abs(p.center-(6+14*.3048))<1e-10);
  assert.ok(p.width>=2.4&&p.width<=2.5,"Native open-front coop must not squeeze the flock through a 1m door");
  assert.ok(Math.abs(p.coop.x1-p.run.x0)<1e-10);
  assert.ok(Math.abs((p.start+p.width)-p.end)<1e-10);
  assert.equal(nativeCoopRunPortal([{...source[0],w:0},source[1]],{x:23,y:0,z:6}),null);
  assert.equal(nativeCoopRunPortal([source[0],{...source[1],x:70}],{x:23,y:0,z:6}),null);
});
test("every garden row stays within property fence and outside the native chicken run",async()=>{
  const {gardenBounds,fenceToGardenClearance,FARM_PERIMETER,aabbOverlap,
    nativeCoopRunPortal}=await import("../src/plot-layout.mjs");
  const bounds=gardenBounds();
  assert.ok(bounds.x1-bounds.x0>=8);
  assert.ok(bounds.z1-bounds.z0>=9.4-1e-10);
  assert.equal(FARM_PERIMETER.length,5);
  assert.ok(fenceToGardenClearance()>1,"plant/leaf envelopes must clear every fence rail by a metre");
  assert.equal(fenceToGardenClearance([[[bounds.x0-1,bounds.z0+1],
    [bounds.x1+1,bounds.z0+1]]],bounds),0,"crossing the garden must be detected");
  const p=nativeCoopRunPortal([{id:"c",type:"coop",x:40,y:10,w:8,d:8},
    {id:"r",type:"run",x:48,y:10,w:12,d:14}],{x:23,y:0,z:6});
  assert.equal(aabbOverlap(bounds,p.run),false,"garden must not intersect native chicken-run footprint");
  assert.equal(aabbOverlap(bounds,p.coop),false,"garden must not intersect native chicken-coop footprint");
});
test("Pennsylvania seasonal sun uses date, longitude and daylight saving, without altering PV",async()=>{
  const {seasonalSun,localUtcOffsetHours}=await import("../src/seasonal-sun.mjs");
  const summer=seasonalSun("2026-06-21",12);
  const winter=seasonalSun("2026-12-21",12);
  const fall=seasonalSun("2026-11-08",12);
  assert.ok(summer.sunriseHour>5.1&&summer.sunriseHour<5.8,summer);
  assert.ok(summer.sunsetHour>20.2&&summer.sunsetHour<21,summer);
  assert.ok(winter.sunriseHour>7&&winter.sunriseHour<7.8,winter);
  assert.ok(winter.sunsetHour>16&&winter.sunsetHour<17,winter);
  assert.ok(summer.dayLengthHours>15&&winter.dayLengthHours<9.5);
  assert.ok(fall.dayLengthHours>9.5&&fall.dayLengthHours<11);
  assert.ok(summer.dayLengthHours-winter.dayLengthHours>5.5);
  assert.ok(summer.elevationDeg>winter.elevationDeg+35);
  for(const s of [summer,winter,fall]){
    assert.ok(s.daylight);
    assert.ok(s.elevationDeg>20);
    assert.ok(s.sunLevel>0);
  }
  assert.equal(seasonalSun("2026-06-21",6).daylight,true);
  assert.equal(seasonalSun("2026-12-21",6).daylight,false);
  assert.equal(seasonalSun("2026-12-21",17).daylight,false);
  assert.equal(localUtcOffsetHours("2026-03-08",1),-5);
  assert.equal(localUtcOffsetHours("2026-03-08",3),-4);
  assert.equal(localUtcOffsetHours("2026-11-01",1),-4);
  assert.equal(localUtcOffsetHours("2026-11-01",3),-5);
  assert.throws(()=>seasonalSun("2026-02-30",12),/Invalid scenario date/);
  assert.throws(()=>seasonalSun("2026-11-08",24),/Invalid local hour/);
});
