import test from "node:test";
import assert from "node:assert/strict";
import {mountOriginalNativeHomestead} from "../src/native-browser-homestead.mjs";

test("browser bootstrap refuses absent original engines without mounting fake UI",()=>{
  let appended=0;
  const root={append(){appended++;}};
  assert.throws(()=>mountOriginalNativeHomestead({
    scene:{renderNativeWorld(){}},utilitiesRoot:root
  }),/Original Solar state unavailable/);
  assert.equal(appended,0);
});
test("browser bootstrap requires a scene consumer before engine initialization",()=>{
  assert.throws(()=>mountOriginalNativeHomestead({utilitiesRoot:{append(){}}}),/Scene must implement/);
});
test("browser bootstrap requires a Utilities host before engine initialization",()=>{
  assert.throws(()=>mountOriginalNativeHomestead({scene:{renderNativeWorld(){}}}),/Utilities root required/);
});
