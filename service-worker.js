const CACHE_NAME='emfe3-smartapart-v5-cache';
const FILES=['./','./index.html','./style.css?v=5.0','./app.js?v=5.0','./manifest.json','./icon.svg'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{event.respondWith(caches.match(event.request).then(resp=>resp||fetch(event.request)));});
