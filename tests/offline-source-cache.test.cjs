"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"sw.js"),"utf8");
const context=vm.createContext({self:{addEventListener(){}},console});
vm.runInContext(source+"\n globalThis.offlineManifest={name:NAME,files:FILES};",context,
 {filename:"sw.js",timeout:30000});
const manifest=JSON.parse(JSON.stringify(context.offlineManifest));
test("offline cache versions all independent Solar/Water/Farm source utilities",()=>{
 assert.match(manifest.name,/v[5-9]|v[1-9][0-9]+/);
 for(const asset of [
  "./src/solar-battery-utility.mjs","./src/farm-native-study.mjs",
  "./src/farm-study-ui.mjs","./src/farm-study-worker.js",
  "./src/water-preset-utility.mjs","./vendor/solar-battery-native.js",
  "./vendor/farm-core.js","./vendor/water-engine.js",
  "./src/utility-registry.mjs"
 ])assert.ok(manifest.files.includes(asset),"Missing offline source utility "+asset);
});
test("entire shipped JavaScript runtime is explicitly cached for offline worker execution",()=>{
 const js=fs.readdirSync(path.join(root,"src")).filter(n=>/\.(?:m?js)$/.test(n));
 const vendor=fs.readdirSync(path.join(root,"vendor")).filter(n=>/\.js$/.test(n));
 for(const name of js)assert.ok(manifest.files.includes("./src/"+name),"Uncached runtime "+name);
 for(const name of vendor)assert.ok(manifest.files.includes("./vendor/"+name),"Uncached original vendor "+name);
 assert.ok(manifest.files.includes("./src/upstream/farm-world/pose-adapter.mjs"));
});
test("offline cache manifest is duplicate-free, in scope, and contains no missing files",()=>{
 const entries=new Set();
 for(const file of manifest.files){
  assert.match(file,/^\.\/[A-Za-z0-9_./-]*$/);
  assert.ok(!file.includes("..")&&!entries.has(file),"Duplicate or unsafe cache path "+file);
  entries.add(file);
  assert.ok(fs.existsSync(path.join(root,file)),"Offline asset not in repo: "+file);
 }
 assert.ok(entries.size>=25);
});
