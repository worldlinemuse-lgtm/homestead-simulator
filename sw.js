/* Homestead-only offline caching, isolated from other Worldline Muse Pages repos. */
const NAME="homestead-3d-2026-11-11-v3",PREFIX="homestead-3d-";
const FILES=["./","./index.html","./src/coordinator.js","./src/main.js","./src/scene.js",
"./src/ui-polish.css","./src/resource-contract.js","./vendor/solar-next-core.js","./vendor/water-engine.js","./vendor/farm-core.js",
"./vendor/three.module.min.js"];
self.addEventListener("install",ev=>{ev.waitUntil(caches.open(NAME).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",ev=>{ev.waitUntil(caches.keys().then(xs=>Promise.all(xs.filter(x=>x.startsWith(PREFIX)&&x!==NAME).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",ev=>{
 const req=ev.request;if(req.method!=="GET")return;
 const url=new URL(req.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 ev.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();ev.waitUntil(caches.open(NAME).then(c=>c.put(req,copy)).catch(()=>{}))}return res}).catch(async()=>{
 const c=await caches.open(NAME),cached=await c.match(req,{ignoreSearch:true});
 if(cached)return cached;
 if(req.mode==="navigate")return (await c.match("./index.html"))||Response.error();
 return Response.error();
 }));
});
