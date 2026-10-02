const CACHE="bibelquiz-v6-1-real-driving";
const SHELL=["/","/static/style.css","/static/app.js","/static/manifest.json","/static/icons/icon-192.png","/static/icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("message",e=>{if(e.data&&e.data.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.pathname.startsWith("/api/")||u.pathname==="/service-worker.js")return;
 // HTML/JS/CSS are network-first so deployed code wins; cache is offline fallback.
 if(e.request.mode==="navigate"||u.pathname.endsWith(".js")||u.pathname.endsWith(".css")){
  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{let cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("/"))));return;
 }
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{let cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r})))
});
