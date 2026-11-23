import test from "node:test";
import assert from "node:assert/strict";
import {mountOriginalNativeHomestead} from "../src/native-browser-homestead.mjs";

const editor=()=>({list:()=>[],selected:()=>null});
test("browser bootstrap refuses absent original engines without mounting fake UI",()=>{
  let appended=0;
  const root={append(){appended++;}};
  assert.throws(()=>mountOriginalNativeHomestead({
    scene:{editor:editor()},utilitiesRoot:root
  }),/Original Solar state unavailable/);
  assert.equal(appended,0);
});
test("browser bootstrap requires the existing 3D editor before engine initialization",()=>{
  assert.throws(()=>mountOriginalNativeHomestead({utilitiesRoot:{append(){}}}),/Existing 3D scene editor required/);
  assert.throws(()=>mountOriginalNativeHomestead({
    scene:{renderNativeWorld(){}},utilitiesRoot:{append(){}}
  }),/Existing 3D scene editor required/);
});
test("browser bootstrap requires a Utilities host before engine initialization",()=>{
  assert.throws(()=>mountOriginalNativeHomestead({scene:{editor:editor()}}),/Utilities root required/);
});
test("browser bootstrap rejects invalid native patch handlers before engine initialization",()=>{
  assert.throws(()=>mountOriginalNativeHomestead({
    scene:{editor:editor()},utilitiesRoot:{append(){}},applyNativePatch:{}
  }),/Native equipment patch handler must be callable/);
});
