"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const scene=fs.readFileSync(path.join(__dirname,"../src/scene.js"),"utf8");
test("rabbit housing has one Farm-owned renderer, not parallel fixed decorative cages",()=>{
  assert.match(scene,/nativeFarmComponentFootprint\(c,origin\)/);
  assert.match(scene,/if\(c\.type==="hutch"\)/);
  assert.match(scene,/nativeHutchFloors\.add\(deck\)/);
  assert.match(scene,/nativeHutchSupports\.add\(leg\)/);
  assert.doesNotMatch(scene,/group\("farm","Rabbit hutches"/);
  assert.doesNotMatch(scene,/hutches\.add\(/);
  assert.doesNotMatch(scene,/RABBIT_HUTCH_ROOF/);
});
test("hutch diagnostics derive their west boundary from native component footprints",()=>{
  assert.match(scene,/nativeEnclosureFootprints\.filter\(p=>p\.type==="hutch"\)/);
  assert.doesNotMatch(scene,/hutchWestWorldX:hutches\.position/);
});

test("hutch support tops intersect the rendered triangulated deck rather than raw terrain",()=>{
  assert.match(scene,/deck\.updateMatrixWorld\(true\)/);
  assert.match(scene,/deckRaycaster\.intersectObject\(deck,false\)/);
  assert.match(scene,/if\(!hits\.length\)throw new Error\("Native hutch support misses deck "/);
  assert.match(scene,/const top=hits\[0\]\.point\.y/);
  assert.doesNotMatch(scene,/const top=terrainY\(px,pz\)\+NATIVE_HUTCH_FLOOR_M/);
});
