"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
test("offline install precaches every local entrypoint module and preserves cache isolation",()=>{
 const text=fs.readFileSync(path.join(__dirname,"../sw.js"),"utf8");
 const match=/const NAME="([^"]+)",PREFIX="([^"]+)";/.exec(text);
 assert.ok(match);
 assert.equal(match[2],"homestead-3d-");
 assert.ok(match[1].startsWith(match[2]));
 const names=[...text.matchAll(/"\.\/([^"]+)"/g)].map(m=>m[1]);
 for(const file of ["index.html","src/main.js","src/scene.js","src/coordinator.js",
   "src/resource-contract.js","src/sim-clock.mjs","src/visual-layout.mjs",
   "src/seasonal-sun.mjs","src/visual-motion.mjs","src/plot-layout.mjs",
   "src/upstream/farm-world/pose-adapter.mjs","vendor/three.module.min.js"]){
   assert.ok(names.includes(file),"missing offline module "+file);
   assert.ok(fs.existsSync(path.join(__dirname,"..",file)),
      "broken offline module path "+file);
 }
 assert.ok(text.includes("url.origin!==scope.origin"),"service worker must not cache third-party origin");
 assert.ok(text.includes("url.pathname.startsWith(scope.pathname)"),
   "cache must stay within homestead GitHub Pages scope");
});
