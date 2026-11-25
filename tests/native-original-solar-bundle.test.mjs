import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {PINNED_SOLAR_RUNTIME_URL} from "../src/native-solar-browser.mjs";
import {ORIGINAL_SOLAR_STEP_BLOB} from "../src/native-solar-minute.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const gitBlobSha=s=>{
 const bytes=Buffer.from(s,"utf8");
 return crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0"))
  .update(bytes).digest("hex");
};

test("bundled Solar runtime contains byte-exact original stateful dispatch",()=>{
 const html=read("vendor/solar-original-runtime.html");
 const start=html.indexOf("(function(){\n'use strict';\n// ---------- Parts (maker spec sheets)");
 assert.ok(start>=0,"Original Solar native simulator start missing");
 const tail="init();\n})();\n";
 const end=html.indexOf(tail,start);
 assert.ok(end>start,"Original Solar native simulator end missing");
 const engine=html.slice(start,end+tail.length);
 assert.equal(gitBlobSha(engine),ORIGINAL_SOLAR_STEP_BLOB,
   "Bundled native Solar engine differs from its pinned upstream Git blob");
 assert.match(engine,/function step\(preview=false\)/);
 assert.match(engine,/window\.SIM=\{/);
 assert.match(html,/solar-sandbox\/source\/sim\.js|source\/sim\.js/);
 assert.match(html,/dccf27949460a044661c1b99eca0e19343ef0c47/);
 assert.doesNotMatch(html,/src="__AUDIO_SRC__"/);
});
test("native Solar runtime and loader are local and cacheable offline",()=>{
 const url=new URL(PINNED_SOLAR_RUNTIME_URL);
 assert.ok(url.pathname.endsWith("/vendor/solar-original-runtime.html"));
 const cache=read("sw.js");
 assert.match(cache,/\.\/vendor\/solar-original-runtime\.html/);
 assert.match(cache,/\.\/src\/native-solar-browser\.mjs/);
 for(const file of ["src/native-solar-minute.mjs","src/native-water-minute.mjs",
   "src/native-farm-minute.mjs","src/native-coupled-runtime.mjs"]){
  assert.match(cache,new RegExp(file.replace(/\./g,"\\.")));
 }
});
