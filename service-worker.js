const CACHE_NAME='emfe3-smartapart-v16-firebase-cache';
const FILES=['./','./index.html','./style.css?v=16.0','./app.js?v=16.0','./manifest.json','./firebase-config.js?v=16.0','./icon.svg','./logo.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
