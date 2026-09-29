const CACHE="bibelquiz-v5-identity-1";
const SHELL=["/","/static/style.css","/static/app.js","/static/manifest.json","/static/icons/icon-192.png","/static/icons/icon-512.png","/static/identity/logo.svg","/static/identity/dove.svg","/static/identity/ark.svg","/static/identity/crown.svg","/static/identity/fish.svg","/static/identity/scroll.svg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.pathname.startsWith("/api/"))return;
 e.respondWith(fetch(e.request).then(r=>{let copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("/"))))
});
