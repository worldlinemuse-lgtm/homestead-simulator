import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Regression: the original native coop roof was inverted (a valley).
// Verify the actual scene rotation assignment and its Three.js X-axis geometry.
test("native coop roof rises toward ridge from both eaves",()=>{
  const source=readFileSync(new URL("../src/scene.js",import.meta.url),"utf8");
  const roofBlock=source.match(/for\(const side of \[-1,1\]\)\{\s*const roof=box\(x1-x0\+\.35,[\s\S]*?nativeCoopHouses\.add\(roof\);\s*\}/);
  assert.ok(roofBlock,"native coop pitched roof construction must exist");
  assert.match(roofBlock[0],/roof\.rotation\.x=-side\*\.34/);
  const depth=4,halfDepth=depth/4,theta=.34;
  for(const side of [-1,1]){
    const rotation=-side*theta;
    const localZ=-side*halfDepth; // ridgeward from each half-roof center
    const ridgeRise=-Math.sin(rotation)*localZ; // Three.js rotation about X: y'=-sin(theta)*z
    const eaveDrop=-Math.sin(rotation)*(-localZ);
    assert.ok(ridgeRise>0.3,"ridge must be higher than roof center");
    assert.ok(eaveDrop< -0.3,"eave must be lower than roof center");
  }
});
